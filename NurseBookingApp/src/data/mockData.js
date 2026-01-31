export const MOCK_NURSES = [
  {
    id: 1,
    name: "Sarah Johnson",
    rating: 4.8,
    reviews: 127,
    experience: "8 years",
    specialization: "General Care",
    distance: "2.3 km",
    price: 45,
    available: true,
    certifications: ["RN", "BLS", "ACLS"],
    languages: ["English", "Hindi"],
    bio: "Experienced registered nurse specializing in home healthcare.",
    location: { lat: 37.7849, lng: -122.4094 }
  },
  {
    id: 2,
    name: "Michael Chen",
    rating: 4.9,
    reviews: 203,
    experience: "12 years",
    specialization: "Elderly Care",
    distance: "3.1 km",
    price: 55,
    available: true,
    certifications: ["RN", "Geriatric Care", "BLS"],
    languages: ["English", "Mandarin"],
    bio: "Specialized in elderly care with extensive experience.",
    location: { lat: 37.7899, lng: -122.4120 }
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    rating: 4.7,
    reviews: 89,
    experience: "5 years",
    specialization: "Post-Surgery",
    distance: "4.5 km",
    price: 50,
    available: false,
    certifications: ["RN", "Wound Care", "BLS"],
    languages: ["English"],
    bio: "Expert in post-operative care and wound management.",
    location: { lat: 37.7750, lng: -122.4200 }
  }
];

export const MOCK_BOOKING_HISTORY = [
  {
    id: 'BK001',
    nurse: "Sarah Johnson",
    service: "General Care",
    date: "2026-01-15",
    time: "14:00",
    status: "completed",
    price: 45,
    rating: 5
  },
  {
    id: 'BK002',
    nurse: "Michael Chen",
    service: "Elderly Care",
    date: "2026-01-10",
    time: "10:00",
    status: "completed",
    price: 55,
    rating: 5
  }
];