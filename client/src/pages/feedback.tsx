import FeedbackForm from "@/components/feedback-form";
import FeedbackDisplay from "@/components/feedback-display";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Share Your Feedback</h1>
          <p className="text-purple-200 text-lg">Your opinion matters to us!</p>
        </div>

        <div className="space-y-8">
          <FeedbackForm />
          <FeedbackDisplay />
        </div>
      </div>
    </div>
  );
}