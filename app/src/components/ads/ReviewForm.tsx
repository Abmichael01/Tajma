import { View, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import { useCreateReview } from "@/hooks/useReviews";
import { useQueryClient } from "@tanstack/react-query";

interface ReviewFormProps {
  adId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ adId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!rating) {
      // TODO: Show error message
      console.error("Please select a rating");
      return;
    }

    try {
      await createReview.mutateAsync({
        ad: adId,
        rating,
        comment: comment.trim() || undefined,
      });

      // Explicitly invalidate and refetch reviews for this ad
      await queryClient.invalidateQueries({ queryKey: ["reviews", "ad", adId] });
      await queryClient.refetchQueries({ queryKey: ["reviews", "ad", adId] });

      setRating(null);
      setComment("");
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || "Failed to submit review";
      console.error(errorMessage);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = (i + 1) as 1 | 2 | 3 | 4 | 5;
      const isFilled = rating ? i < rating : false;

      return (
        <TouchableOpacity
          key={i}
          onPress={() => setRating(starValue)}
          className="mr-1"
        >
          <Ionicons
            name={isFilled ? "star" : "star-outline"}
            size={32}
            color={isFilled ? "#fbbf24" : "#d1d5db"}
          />
        </TouchableOpacity>
      );
    });
  };

  const getRatingLabel = () => {
    if (!rating) return null;
    const labels: Record<number, string> = {
      5: "Excellent",
      4: "Very Good",
      3: "Good",
      2: "Fair",
      1: "Poor",
    };
    return labels[rating];
  };

  return (
    <View className="space-y-4">
      <View>
        <AppText variant="default" weight="medium" className="text-gray-900 mb-2">
          Your Rating <AppText className="text-destructive">*</AppText>
        </AppText>
        <View className="flex-row items-center gap-2">
          {renderStars()}
          {rating && (
            <AppText variant="default" className="text-gray-600 ml-2">
              {getRatingLabel()}
            </AppText>
          )}
        </View>
      </View>

      <View>
        <AppText variant="default" weight="medium" className="text-gray-900 mb-2">
          Your Review (Optional)
        </AppText>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white"
          placeholder="Share your experience with this seller..."
          placeholderTextColor="#9ca3af"
          maxLength={1000}
          textAlignVertical="top"
        />
        <AppText variant="caption" className="text-gray-500 mt-1">
          {comment.length}/1000 characters
        </AppText>
      </View>

      <View className="flex-row gap-2">
        {onCancel && (
          <Button
            variant="ghost"
            onPress={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          onPress={handleSubmit}
          disabled={!rating || createReview.isPending}
          loading={createReview.isPending}
          className="flex-1"
        >
          {createReview.isPending ? "Submitting..." : "Submit Review"}
        </Button>
      </View>
    </View>
  );
}

