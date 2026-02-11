'use client';

import { Heart, DollarSign, Target, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";


const GOAL_AMOUNT = 7.50;
const CURRENT_AMOUNT = 0;
const END_DATE = "February 7, 2026";

export default function DonatePage() {
  const progressPercentage = (CURRENT_AMOUNT / GOAL_AMOUNT) * 100;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 md:px-6">
      <div className="mb-12 flex flex-col items-center text-center">
        <Heart className="mb-4 h-16 w-16 text-primary" />
        <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary">
          Support the Archive
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Your contributions help keep the archive running and free for everyone. Thank you for your support!
        </p>
      </div>

      <Card className="mb-8 border-white/10 bg-black/40 backdrop-blur-lg shadow-xl shadow-black/40">
        <CardHeader className="items-center text-center">
          <div className="flex items-center gap-2 text-primary">
            <Target className="h-6 w-6" />
            <CardTitle className="text-primary">Donation Goal</CardTitle>
          </div>
          <CardDescription>Help us reach our goal to cover server costs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3 w-full" />
            <div className="flex justify-between text-sm font-medium text-primary/90">
              <span>${CURRENT_AMOUNT.toFixed(2)} raised</span>
              <span>Goal: ${GOAL_AMOUNT.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>Goal ends on {END_DATE}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40 backdrop-blur-lg shadow-xl shadow-black/40">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-primary">Make a Donation</CardTitle>
          <CardDescription>
            Every little bit helps cover server costs and development time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-2">
          <p className="text-center text-muted-foreground">
            If you would like to support the archive, you can send your donation directly via PayPal:
          </p>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-6 py-4">
            <p className="text-lg font-semibold text-primary">
              Paypal: <span className="select-all">Nataliya.mayor.zt@gmail.com</span>
            </p>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Every contribution helps cover server costs and ongoing development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
