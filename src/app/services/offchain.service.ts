import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { type } from 'node:os';
import { environment } from 'src/environments/environment';

@Injectable()
export class OffchainService {

  constructor(private http: HttpClient) { }

  async getURIInfo(uri: string): Promise<{name: string, image: string, description: string}> {
    const response: any = await this.http.get(uri).toPromise();
    return response;
  }

  async isVideo(mediaUrl: string): Promise<boolean> {
    const cached = localStorage.getItem('is_video_' + mediaUrl);
    if (cached) {
      return cached === 'true';
    }
    return new Promise((resolve) => {
      const FileType = require('file-type/browser');
      (async () => {
        const response = await fetch(mediaUrl, {
          headers: {
            Range: 'bytes=0-100',
          }
        });
        const fileType = await FileType.fromStream(response.body);
        if (fileType && fileType.mime === 'video/mp4') {
          localStorage.setItem('is_video_' + mediaUrl, 'true');
          resolve(true);
        } else {
          localStorage.setItem('is_video_' + mediaUrl, 'false');
          resolve(false);
        }
      })();
    });
  }

  async getNftData(tokenId: number): Promise<{
      name: string,
      id: string,
      image: string,
      description: string,
      physical: boolean
  }> {
    const response: any = await this.http.get(this.getUri() + '/card/' + tokenId).toPromise();
    response.id = tokenId;
    return response;
  }

  async claimCard(signature: string, email: string, address: string, tokenId: string): Promise<boolean> {
    return ((await this.http.post(this.getUri() + '/claim', {
      signature,
      email,
      address,
      tokenId,
    }, { responseType: 'json' }).toPromise()) as any).status;
  }

  async addDescrption(signature: string, description: string, tokenId: string): Promise<boolean> { //, edition: string, publisher: string, year: string, graded:string, population:string
    return ((await this.http.post(this.getUri() + '/card/description/' + tokenId, {
      signature,
      description,
      // edition,
      // publisher,
      // year,
      // graded,
      // population
    }, { responseType: 'json' }).toPromise()) as any);
  }

  async uploadFile(signature: string, file: any, relativePath: string): Promise<{uri: string, hash: string}> {
    var formData = new FormData();
    //console.log(file);
    //console.log(relativePath);
    //console.log(signature);
    formData.append('file', file, relativePath);
    formData.append('signature', signature);
    //console.log(this.http.post(this.getUri() + '/media', formData, { responseType: 'json' }).toPromise());
    return (await this.http.post(this.getUri() + '/media', formData, { responseType: 'json' }).toPromise()) as any;
  }

  private getUri(): string {
      return environment.offchainApi;
  }
}
