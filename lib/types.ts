export interface Lifestyle {
  smoking: "no" | "outside" | "yes";
  pets: "none" | "cat" | "dog";
  sleep: "early" | "late" | "flexible";
  /** 1 (relaxed) to 5 (spotless) */
  cleanliness: 1 | 2 | 3 | 4 | 5;
  guests: "rarely" | "sometimes" | "often";
  noise: "quiet" | "moderate" | "lively";
  /** Monthly rent budget */
  budget: number;
}

export interface Favourites {
  film: string[];
  music: string[];
  food: string[];
  places: string[];
}

export interface Profile {
  id: string;
  name: string;
  /** Already housed; never offered as a match */
  placed: boolean;
  lifestyle: Lifestyle;
  favourites: Favourites;
}
