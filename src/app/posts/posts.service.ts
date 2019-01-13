import { Post } from './post.model';
import { Injectable, createInjector } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as io from 'socket.io-client';
import { environment } from '../../environments/environment';

const BACKEND_URL = environment.apiUrl + '/posts/';

@Injectable({providedIn: 'root'})
export class PostsService {
  private posts: Post[] = [];

  private socket = io(environment.socketUrl);

  private postsUpdated = new Subject<{posts: Post[], postCount: number}>();

  constructor(public http: HttpClient, public router: Router) {
  }

  getPosts(postPerPage: number, currentPage: number) {
    const queryParams = `?pagesize=${postPerPage}&page=${currentPage}`;
    this.http.get<{message: string, posts: any, maxPosts: number}>(BACKEND_URL + queryParams)
    .pipe(map((postData) => {
      return { posts: postData.posts.map(post => {
        return {
          title: post.title,
          content: post.content,
          id: post._id,
          imagePath: post.imagePath,
          creator: post.creator
        };
      }),
      maxPosts: postData.maxPosts
    };
    }))
    .subscribe((transformedPosts) => {
        this.posts = transformedPosts.posts;
        this.postsUpdated.next({posts: [...this.posts], postCount: transformedPosts.maxPosts });
    });
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  getPostById(postId: string) {
    return this.http.get<{
      _id: string,
      title: string,
      content: string,
      imagePath: string,
      creator: string
    }>(
      BACKEND_URL + postId);
  }

  editPost(postId: string, title: string, content: string, image: File | string) {
    let postData: Post | FormData;
    if (typeof(image) === 'object') {
      postData = new FormData();
      postData.append('id', postId);
      postData.append('title', title);
      postData.append('content', content);
      postData.append('image', image, title);
    } else {
      postData = {id: postId, title: title, content: content, imagePath: image, creator: null};
    }

    this.http.put<{message: string, imagePath: string}>(BACKEND_URL + postId, postData)
    .subscribe((responseData) => {
      this.router.navigate(['/']);
    });
  }
  addPost(title: string, content: string, image: File) {
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image, title);

    this.http.post<{message: string, post: Post}>(BACKEND_URL, postData)
    .subscribe((responseData) => {
      this.router.navigate(['/']);
    });

  }

  deletePost(postId: string) {
    return this.http.delete<{message: string}>(BACKEND_URL + postId);
  }

  listenOnChanges() {
    const observable = new Observable(observer => {
      this.socket.on('post', (data) => {
        observer.next(data);
      });
  });

  return observable;
}

}
