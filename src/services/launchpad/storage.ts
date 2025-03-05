import Storage from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

const storage = new Storage({
  keyFilename: process.env.GCP_KEY_PATH_STORAGE,
});

const bucketName = "vocal-fun"

export const uploadFile = async (file: Express.Multer.File, folder: string): Promise<string> => {
  const bucket = storage.bucket(bucketName);
  const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
  const blob = bucket.file(fileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
    gzip: true
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      resolve(publicUrl);
    });
    blobStream.end(file.buffer);
  });
}; 