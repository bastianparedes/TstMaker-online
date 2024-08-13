import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import * as cloudinary from 'cloudinary';

@Injectable()
export class FileService {
  private readonly cloudinary = cloudinary.v2;

  constructor() {
    this.cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }

  private getFolderPath(userId: number) {
    return ['trilma', process.env.NODE_ENV, userId].join('/');
  }

  upload(userId: number, fileBuffer: Buffer, resourceType: 'raw' | 'image' | 'video' | 'auto') {
    return new Promise<string>((resolve) => {
      this.cloudinary.uploader
        .upload_stream({ resource_type: resourceType, folder: this.getFolderPath(userId) }, (error, result) => {
          if (error) {
            throw new Error('Error uploading file');
          } else {
            const pathParts = result.public_id.split('/');
            const publicId = pathParts[pathParts.length - 1];
            resolve(publicId);
          }
        })
        .end(fileBuffer);
    });
  }

  async get(userId: number, fileId: string, resourceType: 'raw' | 'image' | 'video' | 'auto') {
    const response = await fetch(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${this.getFolderPath(userId)}/${fileId}`);
    const buffer = await response.buffer();
    return buffer;
  }
}
