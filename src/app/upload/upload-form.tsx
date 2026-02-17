'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  tags: z.string().min(1, 'Please add at least one tag (comma-separated).'),
  video: z.any()
    .refine((files) => files?.length === 1, 'A video file is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 50MB.`),
});

const captureFrame = (videoEl: HTMLVideoElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return reject('Canvas 2D context is not available.');
    }
    const aspectRatio = 16 / 9;
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoWidth / aspectRatio;
    const sourceY = (videoEl.videoHeight - canvas.height) / 2;
    context.drawImage(videoEl, 0, sourceY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    resolve(dataUrl);
  });
};


export function UploadForm() {
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [thumbnailTime, setThumbnailTime] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      tags: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setVideoPreviewUrl(null);
    setThumbnailPreviewUrl(null);
    setVideoDuration(0);
    setThumbnailTime(1);

    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a video file.',
        });
        form.setValue('video', null);
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(videoUrl);
    }
  };

  const handleVideoLoaded = async () => {
    const video = videoRef.current;
    if (!video) return;

    setVideoDuration(video.duration);

    const initialTime = video.duration > 1 ? 1 : 0;
    video.currentTime = initialTime;
    setThumbnailTime(initialTime);
  };

  const handleSeeked = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const thumbUrl = await captureFrame(video);
      setThumbnailPreviewUrl(thumbUrl);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Thumbnail Generation Failed',
        description: 'Could not generate a thumbnail for this video.',
      });
    }
  };

  const handleSliderChange = (value: number[]) => {
    const time = value[0];
    setThumbnailTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const videoFileRef = form.register('video');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const file = values.video[0];
    if (!file) {
      toast({ variant: 'destructive', title: 'No Video File', description: 'Please select a video to upload.' });
      return;
    }

    /* Thumbnail generation is mandatory for now based on logic */
    if (!thumbnailPreviewUrl) {
      toast({
        variant: 'destructive',
        title: 'Thumbnail not ready',
        description: 'Please wait for the thumbnail to be generated before uploading.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', values.title);
      formData.append('tags', values.tags);

      // Convert thumbnail data URL to blob and append
      if (thumbnailPreviewUrl.startsWith('data:')) {
        const fetchRes = await fetch(thumbnailPreviewUrl);
        const blob = await fetchRes.blob();
        formData.append('thumbnail', blob, 'thumbnail.jpg');
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast({
        title: 'Upload Successful',
        description: `"${values.title}" has been added to the archive.`,
      });
      form.reset();
      setVideoPreviewUrl(null);
      setThumbnailPreviewUrl(null);
      setVideoDuration(0);
      setThumbnailTime(1);

    } catch (error) {
      console.error("Upload failed: ", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Could not upload the clip. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (isSubmitting) return 'Uploading...';
    return 'Upload Clip';
  }

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-lg shadow-xl shadow-black/40">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="video"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Video Clip</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="video/*"
                      {...videoFileRef}
                      onChange={(e) => {
                        field.onChange(e.target.files);
                        handleFileChange(e);
                      }}
                      className="pt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </FormControl>
                  <FormDescription>
                    Max file size: 50MB
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {videoPreviewUrl && (
              <div className="space-y-4 rounded-lg border border-primary/30 p-4">
                <div>
                  <FormLabel className="text-primary/80">Video Preview</FormLabel>
                  <video
                    ref={videoRef}
                    src={videoPreviewUrl}
                    controls
                    muted
                    onLoadedMetadata={handleVideoLoaded}
                    onSeeked={handleSeeked}
                    crossOrigin="anonymous"
                    className="mt-2 w-full rounded-md"
                  />
                </div>

                {videoDuration > 0 && (
                  <div className="space-y-3 pt-2">
                    <FormLabel className="text-primary/80">Select Thumbnail Frame</FormLabel>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[thumbnailTime]}
                        max={videoDuration}
                        step={0.1}
                        onValueChange={handleSliderChange}
                      />
                      <span className="w-20 text-center font-mono text-xs text-muted-foreground">
                        {new Date(thumbnailTime * 1000).toISOString().substr(14, 5)}
                      </span>
                    </div>
                  </div>
                )}

                {thumbnailPreviewUrl && (
                  <div>
                    <FormLabel className="text-primary/80">Thumbnail Preview</FormLabel>
                    <div className="relative mt-2 w-full aspect-video overflow-hidden rounded-md">
                      <Image src={thumbnailPreviewUrl} alt="Thumbnail preview" layout="fill" objectFit="cover" />
                    </div>
                  </div>
                )}
              </div>
            )}


            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Clip Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Messi's Incredible Solo Goal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary">Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="La Liga, Goal, Dribble (comma-separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full text-base font-bold py-6">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {getButtonText()}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
