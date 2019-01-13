import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Post } from '../post.model';
import { PostsService } from '../posts.service';
import { Subscription, Observable } from 'rxjs';
import { PageEvent } from '@angular/material';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit, OnDestroy {

  private subscription: Subscription;
  private authStatusListenerSub: Subscription;
  private changeSubscription: Subscription;
  isAuth = false;

  posts: Post[] = [];
  isLoading = false;
  totalPosts = 0;
  postsPerPage = 2;
  currentPage = 1;
  pageSizeOptions = [1, 2, 5, 10];
  userId: string;

  constructor(public postService: PostsService, public authService: AuthService) {
  }

  onDelete(postId: string) {
    this.isLoading = true;
    this.postService.deletePost(postId).subscribe( () => {
      this.postService.getPosts(this.postsPerPage, this.currentPage);
    }, () => {
      this.isLoading = false;
    });
  }

  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.postsPerPage = pageData.pageSize;
    this.postService.getPosts(this.postsPerPage, this.currentPage);
  }

  ngOnInit() {
    this.loadData();
    this.changeSubscription = this.postService.listenOnChanges().subscribe( (data) => {
      this.loadData();
    });
    this.isLoading = true;
    this.userId = this.authService.getUserId();
    this.subscription = this.postService
    .getPostUpdateListener()
    .subscribe((postData: {posts: Post[], postCount: number}) => {
      this.isLoading = false;
      this.posts = postData.posts;
      this.totalPosts = postData.postCount;
    });
    this.isAuth = this.authService.getAuthStatus();
    this.authStatusListenerSub = this.authService.getAuthStatusListener().subscribe(isAuth => {
      this.isAuth = isAuth;
      this.userId = this.authService.getUserId();
    });
  }

  private loadData() {
    this.postService.getPosts(this.postsPerPage, this.currentPage);
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.authStatusListenerSub.unsubscribe();
    this.changeSubscription.unsubscribe();
  }
}
