import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { type Feedback } from "@shared/schema";
import StarRating from "./star-rating";

function getInitials(name: string) {
  return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
}

function getTimeAgo(timestamp: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function getAvatarColor(name: string) {
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function FeedbackDisplay() {
  const { data: feedbacks = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  if (isLoading) {
    return (
      <Card className="shadow-lg bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Feedback</h2>
            <div className="flex items-center space-x-2 text-gray-400">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/50 animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-16 mb-3"></div>
                    <div className="h-3 bg-gray-600 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Feedback</h2>
          <div className="flex items-center space-x-2 text-gray-400">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">
              {feedbacks.length} review{feedbacks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No feedback yet</h3>
            <p className="text-gray-400">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/50 hover:shadow-md transition-shadow duration-200 animate-in slide-in-from-bottom-2"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${getAvatarColor(feedback.name)} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-medium text-sm">
                        {getInitials(feedback.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{feedback.name}</h3>
                      <div className="flex items-center space-x-2">
                        <StarRating
                          rating={feedback.rating}
                          onRatingChange={() => {}}
                          disabled
                          size="sm"
                        />
                        <span className="text-xs text-gray-400">
                          {feedback.rating} star{feedback.rating !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(feedback.timestamp)}
                  </span>
                </div>
                <p className="text-gray-300 leading-relaxed">{feedback.comment}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}