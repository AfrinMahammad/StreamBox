import fs from "fs";
import AWS from "aws-sdk";
import multer from "multer";
import dotenv from "dotenv";
import vttConvert from "aws-transcription-to-vtt";
import Video from "../models/Video.js";

dotenv.config();

AWS.config.update(
  {
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
  true
);

// Create an S3 instance
const s3 = new AWS.S3();

const transcribeService = new AWS.TranscribeService();

export const upload = multer({ dest: "uploads/" });

export const uploadFile = (bucketName, fileName, fileContent, callback) => {
  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
  };

  s3.upload(uploadParams, (err, data) => {
    if (err) {
      console.error("Error uploading file to S3:", err);
      callback(err, null);
    } else {
      console.log("File uploaded successfully to S3:", data.Location);
      callback(null, data.Location);
    }
  });
};

export const uploadVideo = (req, res) => {

  const file = req.file;
  const stream = fs.createReadStream(file.path);
  const bucketName = "streamboxvideos";
  const objectKey = file.originalname;

  uploadFile(bucketName, objectKey, stream, async (err, videoUrl) => {
    if (err) {
      console.error("Error uploading video:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to upload video." });
    }
  
    console.log("Video uploaded successfully:", videoUrl);

    fs.unlink(file.path, (unlinkErr) => {
      if (unlinkErr) {
        console.error("Error deleting local file:", unlinkErr);
      } else {
        console.log("Local file deleted successfully");
      }
    });

    const captionsUrl =  transcribeVideo(bucketName, objectKey)
    return {videoUrl, captionsUrl}
  });
};

async function transcribeVideo(bucketName, objectKey) {
  const jobName = `${objectKey}`;
  const params = {
    TranscriptionJobName: jobName,
    LanguageCode: "en-US",
    Media: {
      MediaFileUri: `s3://${bucketName}/${objectKey}`,
    },
    OutputBucketName: "streamboxvideocaptions", // Destination bucket for transcription output
  };
   await transcribeService.startTranscriptionJob(params, (err, data) => {
    if (err) {
      console.error("Error starting transcription job:", err);
    } else {
      console.log("Transcription job started successfully:", data);
     waitForTranscriptionJobCompletion(jobName, (err, jsonData) => {
        if (err) {
          console.error("Error:", err);
        } else {
          // Process the downloaded JSON data
          console.log("JSON data:", jsonData);
          const vtt = vttConvert(jsonData);
          console.log(vtt);
          const vtt_bucket = "streambox-vtts";
          uploadFile(vtt_bucket, `${objectKey}.vtt`, vtt, async (vttErr, vttUrl) => {
            if (vttErr) {
              console.error("Error uploading VTT file:", vttErr);
            } else {
              console.log("VTT file uploaded successfully:", vttUrl);
              return vttUrl
            }
          });
        }
      });
    }
  });
}

function waitForTranscriptionJobCompletion(jobName, callback) {
  const params = {
    TranscriptionJobName: jobName,
  };

  function pollStatus() {
    transcribeService.getTranscriptionJob(params, (err, data) => {
      if (err) {
        console.error("Error getting transcription job status:", err);
        callback(err);
      } else {
        const { TranscriptionJob } = data;
        const status = TranscriptionJob.TranscriptionJobStatus;
        console.log("Transcription job status:", status);

        if (status === "COMPLETED") {
          // Extract bucket name and object key from TranscriptFileUri
          const transcriptFileUri =
            TranscriptionJob.Transcript.TranscriptFileUri;
          const parts = transcriptFileUri.split("/");
          const bucketName = parts[3];
          const objectKey = parts.slice(4).join("/");

          // Download JSON file when transcription job is complete
          downloadJsonFile(bucketName, objectKey, callback);
        } else if (status === "FAILED" || status === "CANCELLED") {
          console.error("Transcription job failed or was cancelled.");
          callback(new Error("Transcription job failed or was cancelled."));
        } else {
          // Retry after a delay if job is still in progress
          setTimeout(pollStatus, 5000); // Retry every 5 seconds
        }
      }
    });
  }
  // Initial call to start polling
  pollStatus();
}

function downloadJsonFile(bucketName, objectKey, callback) {
  const params = {
    Bucket: bucketName,
    Key: objectKey, // Add the object key parameter
  };

  s3.getObject(params, (err, data) => {
    if (err) {
      console.error("Error downloading JSON file from S3:", err);
      callback(err);
    } else {
      // Data is a buffer containing the contents of the JSON file
      callback(null, JSON.parse(data.Body.toString("utf-8")));
    }
  });
}
