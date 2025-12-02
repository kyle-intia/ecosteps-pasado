import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/Navbar";
import { Users, Leaf, Camera, Send, Loader2, Search, TrendingUp, Clock, Flame, Filter, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import useAuth from "../hooks/useAuth";
import PostCard from "@/components/PostCard";
import {
  getCommunityPosts, getFollowingFeed, getFollowingList, createCommunityPost,
  likePost, repostPost, sharePost, commentOnPost, deleteComment, deletePost,
  followUser, unfollowUser
} from "../lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const LIMIT = 6;

type Tab = "all" | "following";
type Sort =  "recent" | "trending" | "popular" ;

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [sortBy, setSortBy] = useState<Sort>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [feeds, setFeeds] = useState<Record<Tab, { posts: any[]; page: number; hasMore: boolean; loading: boolean; loadingMore: boolean }>>({
    all: { posts: [], page: 1, hasMore: true, loading: true, loadingMore: false },
    following: { posts: [], page: 1, hasMore: true, loading: false, loadingMore: false },
  });
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();
  const { user } = useAuth() as { user: { _id?: string } };
  const userId = user?._id;

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadFollowingList = async () => {
    try {
      const res = await getFollowingList();
      const ids = new Set<string>((Array.isArray(res) ? res : []).map((item: any) => String(item.following?._id || item._id || item)));
      setFollowingIds(ids);
    } catch (err) { /* ignore */ }
  };

  const fetchPosts = useCallback(async (tab: Tab, page = 1, reset = true) => {
    const stateKey = tab;
    setFeeds(prev => ({
      ...prev,
      [stateKey]: { ...prev[stateKey], loading: page === 1, loadingMore: page > 1 }
    }));

    try {
      let posts: any[] = [];

      if (tab === "all") {
        // You can extend your API to accept sort + search params
        const res = await getCommunityPosts(page, LIMIT, {
          sort: sortBy,
          search: debouncedQuery || undefined
        });
        posts = Array.isArray(res) ? res : res?.posts || [];
      } else {
        const res = await getFollowingFeed(page, LIMIT);
        posts = Array.isArray(res) ? res : res?.posts || [];
      }

      // Client-side fallback filtering if API doesn't support search/sort
      if (debouncedQuery && tab === "following") {
        posts = posts.filter((p: any) =>
          p.content?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
      }

      const normalized = posts.map((p: any) => ({
        ...p,
        isFollowing: p.author?._id ? followingIds.has(p.author._id) : false,
        likesCount: p.likesCount ?? p.likes?.length ?? 0,
        repostsCount: p.repostsCount ?? p.reposts?.length ?? 0,
        sharesCount: p.sharesCount ?? p.shares?.length ?? 0,
      }));

      setFeeds(prev => ({
        ...prev,
        [stateKey]: {
          ...prev[stateKey],
          posts: reset ? normalized : [...prev[stateKey].posts, ...normalized],
          page,
          hasMore: normalized.length >= LIMIT,
          loading: false,
          loadingMore: false,
        }
      }));
    } catch (err: any) {
      toast({ title: "Failed to load posts", description: err.message, variant: "destructive" });
      setFeeds(prev => ({ ...prev, [stateKey]: { ...prev[stateKey], loading: false, loadingMore: false } }));
    }
  }, [debouncedQuery, sortBy, followingIds, toast]);

  // Initial load
  useEffect(() => {
    loadFollowingList();
  }, []);

  useEffect(() => {
    fetchPosts(activeTab, 1, true);
  }, [activeTab, debouncedQuery, sortBy, fetchPosts]);

  const createPost = async () => {
    if (!postContent.trim() && !selectedImage) return toast({ title: "Empty post", variant: "destructive" });
    setCreatingPost(true);
    try {
      const form = new FormData();
      form.append("content", postContent);
      form.append("visibility", visibility);
      if (selectedImage) form.append("image", selectedImage);

      const res = await createCommunityPost(form);
      const newPost = res?.data || res;
      newPost.isFollowing = followingIds.has(newPost.author._id);

      setFeeds(prev => ({
        all: { ...prev.all, posts: [newPost, ...prev.all.posts] },
        following: { ...prev.following, posts: newPost.isFollowing ? [newPost, ...prev.following.posts] : prev.following.posts },
      }));

      setPostContent(""); setSelectedImage(null);
      toast({ title: "Post shared!" });
    } catch (err: any) {
      toast({ title: "Post failed", description: err.message, variant: "destructive" });
    } finally {
      setCreatingPost(false);
    }
  };

  const updatePostInFeeds = (updated: any) => {
    setFeeds(prev => {
      const copy = { ...prev };
      (["all", "following"] as Tab[]).forEach(tab => {
        copy[tab].posts = copy[tab].posts.map(p => p._id === updated._id ? { ...p, ...updated } : p);
      });
      return copy;
    });
  };

  const removePostFromFeeds = (postId: string) => {
    setFeeds(prev => ({
      all: { ...prev.all, posts: prev.all.posts.filter(p => p._id !== postId) },
      following: { ...prev.following, posts: prev.following.posts.filter(p => p._id !== postId) },
    }));
  };

  const feed = feeds[activeTab];

  if (isPending) return <Spinner />;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={signOut} />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" /> EcoStep Community
          </h1>
          <p className="text-muted-foreground">Connect, share, and inspire the world to go green</p>
        </div>

        {/* Create Post */}
        <Card className="mb-8 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-success" /> Share Your Eco Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What eco-friendly action did you take today?"
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            {selectedImage && (
              <div className="relative">
                <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="rounded-lg max-h-64 object-contain mx-auto" />
                <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setSelectedImage(null)}>
                  ×
                </Button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={e => setSelectedImage(e.target.files?.[0] || null)} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-2" /> Photo
                </Button>
              </div>
              <div className="flex gap-2">

                <div className="hidden md:flex gap-2">
        <Button
          size="sm"
          variant={visibility === "public" ? "default" : "outline"}
          onClick={() => setVisibility("public")}
        >
          Public
        </Button>

        <Button
          size="sm"
          variant={visibility === "private" ? "default" : "outline"}
          onClick={() => setVisibility("private")}
        >
          Private
        </Button>
      </div>

      {/* Mobile Popover (three dots) */}
      <div className="sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-32 p-2" align="end">
            <Button
              className="w-full mb-2"
              size="sm"
              variant={visibility === "public" ? "default" : "outline"}
              onClick={() => setVisibility("public")}
            >
              Public
            </Button>

            <Button
              className="w-full"
              size="sm"
              variant={visibility === "private" ? "default" : "outline"}
              onClick={() => setVisibility("private")}
            >
              Private
            </Button>
          </PopoverContent>
        </Popover>
      </div>
                 <Button onClick={createPost} disabled={creatingPost || (!postContent.trim() && !selectedImage)}>
                  {creatingPost ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar + Tabs + Sort */}
        <div className="space-y-4 mb-6">

          {/* Tab Navigation */}
          <div className="flex justify-between gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                onClick={() => setActiveTab("all")}
              >
                All Posts
              </Button>
              <Button
                variant={activeTab === "following" ? "default" : "outline"}
                onClick={() => setActiveTab("following")}
              >
                Following
              </Button>

            </div>
            <div className="relative gap-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-base"
              />
              {searchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Sort Filters */}
          {activeTab === "all" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
          
              <PopoverContent className="w-40 p-2">
                <div className="flex flex-col gap-2">
                  <Button
                    variant={sortBy === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("recent")}
                    className="justify-start"
                  >
                    <Clock className="h-4 w-4 mr-1" /> Recent
                  </Button>
                  
                  <Button
                    variant={sortBy === "trending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("trending")}
                    className="justify-start"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" /> Trending
                  </Button>
          
                  <Button
                    variant={sortBy === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("popular")}
                    className="justify-start"
                  >
                    <Flame className="h-4 w-4 mr-1" /> Popular
                  </Button>


          

                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {feed.loading && feed.posts.length === 0 ? (
            <div className="text-center py-16"><Spinner /></div>
          ) : feed.posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16 text-muted-foreground">
                {searchQuery ? "No posts found matching your search." : "No posts yet. Be the first to share!"}
              </CardContent>
            </Card>
          ) : (
            feed.posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={userId}
                showRepostLabel={false}
                isFollowing={followingIds.has(post.author._id)}
                onLike={async (id) => {
                  const updated = await likePost(id);
                  updated && updatePostInFeeds(updated);
                }}
                onRepost={async (id) => {
                  const updated = await repostPost(id);
                  updated && updatePostInFeeds(updated);
                }}
                onShare={async (id) => {
                  const updated = await sharePost(id);
                  updated && updatePostInFeeds(updated);
                }}
                onComment={async (id, content) => {
                  const updated = await commentOnPost(id, content);
                  updated && updatePostInFeeds(updated);
                }}
                onDeletePost={async (id) => {
                  await deletePost(id);
                  removePostFromFeeds(id);
                  toast({ title: "Post deleted" });
                }}
                onDeleteComment={async (postId, commentId) => {
                  await deleteComment(postId, commentId);
                  updatePostInFeeds({
                    _id: postId,
                    comments: post.comments?.filter(c => c._id === commentId ? null : c).filter(Boolean)
                  });
                }}
                onToggleFollow={async (targetId, follow) => {
                  follow ? await followUser(targetId) : await unfollowUser(targetId);
                  setFollowingIds(prev => {
                    const next = new Set(prev);
                    follow ? next.add(targetId) : next.delete(targetId);
                    return next;
                  });
                  toast({ title: follow ? "Now following" : "Unfollowed" });
                }}
                onUpdatePost={updatePostInFeeds}
              />
            ))
          )}
        </div>

        {/* Load More */}
        {feed.hasMore && !feed.loading && (
          <div className="text-center mt-10">
            <Button
              onClick={() => fetchPosts(activeTab, feed.page + 1, false)}
              disabled={feed.loadingMore}
            >
              {feed.loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Load More
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Community;