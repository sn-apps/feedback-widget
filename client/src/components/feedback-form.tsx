import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, NotebookPen, CheckCircle } from "lucide-react";
import StarRating from "./star-rating";

const formSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(1, "Please enter your feedback").max(500, "Feedback must be less than 500 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function FeedbackForm() {
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      rating: 0,
      comment: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/feedback", data);
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const watchedComment = form.watch("comment");
  const commentLength = watchedComment?.length || 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">
                    Your Name <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      className="px-4 py-3 rounded-xl border-2 border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:border-purple-500 transition-colors duration-200"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">
                    Rating <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-3">
                      <StarRating
                        rating={field.value}
                        onRatingChange={field.onChange}
                        size="lg"
                      />
                      <span className="text-sm text-gray-400">
                        {field.value > 0 ? (
                          ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][field.value]
                        ) : (
                          "Click to rate"
                        )}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">
                    Your Feedback <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about your experience..."
                      rows={4}
                      className="px-4 py-3 rounded-xl border-2 border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:border-purple-500 transition-colors duration-200 resize-none"
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage className="text-red-400 text-sm" />
                    <div className={`text-xs ${commentLength > 500 ? 'text-red-400' : 'text-gray-400'}`}>
                      {commentLength}/500 characters
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                {mutation.isPending ? (
                  <>
                    <span>Submitting...</span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Submit Feedback</span>
                    <NotebookPen className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {showSuccess && (
          <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-400/30 rounded-xl animate-in slide-in-from-bottom-2">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-emerald-400 mr-3" />
              <div>
                <p className="text-emerald-300 font-medium">Thank you for your feedback!</p>
                <p className="text-emerald-400 text-sm">Your review has been submitted successfully.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}