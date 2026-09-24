const PLACE_QUERY = "Alpha Rijschool, Turnhoutsebaan 76B, 2100 Antwerpen";
const REVALIDATE_SECONDS = 60 * 60 * 12;

export type GoogleReview = {
  id: string;
  author: string;
  authorUrl?: string;
  rating: number;
  text: string;
  relativeTime?: string;
};

export type GoogleReviewSummary = {
  rating?: number;
  reviewCount?: number;
  mapsUrl: string;
  reviews: GoogleReview[];
};

type AuthorAttribution = {
  displayName?: string;
  uri?: string;
};

type PlaceReview = {
  name?: string;
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: AuthorAttribution;
};

type PlaceDetails = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlaceReview[];
};

export async function getGoogleReviews(): Promise<GoogleReviewSummary | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const placeId = process.env.GOOGLE_PLACE_ID || (await findPlaceId(apiKey));
    if (!placeId) return null;

    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=nl`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "reviews,rating,userRatingCount,googleMapsUri",
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error(`Google reviews ophalen mislukt (${response.status})`);
      return null;
    }

    const place = (await response.json()) as PlaceDetails;
    const reviews = (place.reviews ?? [])
      .map((review, index) => toReview(review, index))
      .filter((review): review is GoogleReview => review !== null);

    if (reviews.length === 0) return null;

    return {
      rating: place.rating,
      reviewCount: place.userRatingCount,
      mapsUrl: place.googleMapsUri ?? "https://www.google.com/maps/search/?api=1&query=Alpha+Rijschool+Turnhoutsebaan+76B",
      reviews,
    };
  } catch {
    console.error("Google reviews ophalen mislukt");
    return null;
  }
}

async function findPlaceId(apiKey: string) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({ textQuery: PLACE_QUERY, languageCode: "nl" }),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { places?: { id?: string }[] };
  const id = data.places?.[0]?.id;
  return id?.replace(/^places\//, "") || null;
}

function toReview(review: PlaceReview, index: number): GoogleReview | null {
  const author = review.authorAttribution?.displayName?.trim();
  const text = review.originalText?.text?.trim() || review.text?.text?.trim();
  if (!author || !text) return null;

  return {
    id: review.name ?? `${author}-${index}`,
    author,
    authorUrl: review.authorAttribution?.uri,
    rating: review.rating ?? 5,
    text,
    relativeTime: review.relativePublishTimeDescription,
  };
}
