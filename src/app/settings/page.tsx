'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Upload, Camera } from 'lucide-react';
import Image from 'next/image';
import type { SessionUser } from '@/types/session';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [displayName, setDisplayName] = useState((session?.user as SessionUser)?.displayName || '');
  const [bio, setBio] = useState((session?.user as SessionUser)?.bio || '');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const user = session?.user as SessionUser;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'Please upload an image file.',
        });
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'Please upload an image file.',
        });
        return;
      }

      setBannerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('displayName', displayName);
      formData.append('bio', bio);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }
      if (bannerImage) {
        formData.append('bannerImage', bannerImage);
      }

      const res = await fetch('/api/user/settings', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to update settings');

      const data = await res.json();

      toast({
        title: 'Settings Updated',
        description: 'Your profile has been updated successfully.',
      });

      // Update local state with new data
      if (data.displayName) setDisplayName(data.displayName || '');
      if (data.bio) setBio(data.bio || '');

      // Update session
      await update();
      setPreviewUrl(null);
      setProfilePicture(null);
      setBannerPreviewUrl(null);
      setBannerImage(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update settings.',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="space-y-4">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl || user?.profilePicture || ''} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-neutral-800 text-2xl">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change Picture
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Banner Image */}
          <div className="space-y-4">
            <Label>Banner Image</Label>
            <div className="space-y-2">
              {/* Banner Preview */}
              <div className="relative h-32 w-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
                {(bannerPreviewUrl || user?.bannerImage) ? (
                  <Image
                    src={bannerPreviewUrl || user?.bannerImage || ''}
                    alt="Banner"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No banner image
                  </div>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => bannerInputRef.current?.click()}
                className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Change Banner
              </Button>
              <p className="text-xs text-muted-foreground">
                Recommended: 1500x500px. JPG or PNG
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="border-neutral-700 bg-neutral-800"
            />
            <p className="text-xs text-muted-foreground">
              This is the name that will be shown on your profile
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="border-neutral-700 bg-neutral-800"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="min-h-[100px] w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="border-neutral-700 bg-neutral-800 opacity-50"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={uploading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
