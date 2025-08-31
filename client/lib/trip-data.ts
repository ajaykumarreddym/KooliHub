export interface TripRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  duration: string;
  distance: string;
  price: number;
  vehicleType: string;
  amenities: string[];
  departurePoints: DeparturePoint[];
  schedules: TripSchedule[];
  rating: number;
  reviewCount: number;
  image: string;
}

export interface DeparturePoint {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
}

export interface TripSchedule {
  id: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  totalSeats: number;
  date: string;
}

export interface SeatBooking {
  routeId: string;
  scheduleId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  seatNumber: number;
  departurePoint: string;
  destinationPoint: string;
}

export const tripRoutes: TripRoute[] = [
  {
    id: "rayachoty-tirupati",
    name: "Rayachoty to Tirupati Express",
    from: "Rayachoty",
    to: "Tirupati",
    duration: "2h 30min",
    distance: "120 km",
    price: 280,
    vehicleType: "Luxury Coach",
    amenities: ["WiFi", "AC", "Reclining Seats", "USB Charging"],
    image: "🚌",
    rating: 4.8,
    reviewCount: 1250,
    departurePoints: [
      {
        id: "rayachoty-bus-stand",
        name: "Rayachoty Bus Stand",
        address: "Main Bus Stand, Rayachoty",
        coordinates: { lat: 14.0558, lng: 78.7539 },
      },
      {
        id: "madanapalle",
        name: "Madanapalle Junction",
        address: "Railway Station Road, Madanapalle",
        coordinates: { lat: 13.5503, lng: 78.5026 },
      },
      {
        id: "punganur",
        name: "Punganur",
        address: "Bus Stand, Punganur",
        coordinates: { lat: 13.3667, lng: 78.5667 },
      },
    ],
    schedules: [
      {
        id: "morning-1",
        departureTime: "07:00",
        arrivalTime: "08:30",
        availableSeats: 12,
        totalSeats: 45,
        date: "2024-01-15",
      },
      {
        id: "morning-2",
        departureTime: "09:00",
        arrivalTime: "10:30",
        availableSeats: 8,
        totalSeats: 45,
        date: "2024-01-15",
      },
      {
        id: "afternoon-1",
        departureTime: "14:00",
        arrivalTime: "15:30",
        availableSeats: 20,
        totalSeats: 45,
        date: "2024-01-15",
      },
      {
        id: "evening-1",
        departureTime: "18:00",
        arrivalTime: "19:30",
        availableSeats: 5,
        totalSeats: 45,
        date: "2024-01-15",
      },
    ],
  },
  {
    id: "rayachoty-kadapa",
    name: "Rayachoty to Kadapa Express",
    from: "Rayachoty",
    to: "Kadapa",
    duration: "1h 45min",
    distance: "65 km",
    price: 150,
    vehicleType: "Premium Bus",
    amenities: ["AC", "Comfortable Seats", "Reading Lights"],
    image: "🚐",
    rating: 4.6,
    reviewCount: 890,
    departurePoints: [
      {
        id: "rayachoty-center",
        name: "Rayachoty Town Center",
        address: "Main Road, Rayachoty",
        coordinates: { lat: 14.0558, lng: 78.7539 },
      },
      {
        id: "muddanur",
        name: "Muddanur",
        address: "Bus Stop, Muddanur",
        coordinates: { lat: 14.1333, lng: 78.8167 },
      },
    ],
    schedules: [
      {
        id: "freq-1",
        departureTime: "08:00",
        arrivalTime: "08:45",
        availableSeats: 15,
        totalSeats: 30,
        date: "2024-01-15",
      },
      {
        id: "freq-2",
        departureTime: "10:00",
        arrivalTime: "10:45",
        availableSeats: 22,
        totalSeats: 30,
        date: "2024-01-15",
      },
      {
        id: "freq-3",
        departureTime: "16:00",
        arrivalTime: "16:45",
        availableSeats: 18,
        totalSeats: 30,
        date: "2024-01-15",
      },
    ],
  },
  {
    id: "rayachoty-bangalore",
    name: "Rayachoty to Bangalore Express",
    from: "Rayachoty",
    to: "Bangalore",
    duration: "4h 15min",
    distance: "180 km",
    price: 400,
    vehicleType: "Tourist Coach",
    amenities: ["WiFi", "AC", "Panoramic Windows", "Snack Service"],
    image: "🌊",
    rating: 4.7,
    reviewCount: 567,
    departurePoints: [
      {
        id: "rayachoty-highway",
        name: "NH 44 Junction",
        address: "National Highway 44, Rayachoty",
        coordinates: { lat: 14.0558, lng: 78.7539 },
      },
    ],
    schedules: [
      {
        id: "scenic-1",
        departureTime: "09:00",
        arrivalTime: "11:15",
        availableSeats: 25,
        totalSeats: 40,
        date: "2024-01-15",
      },
      {
        id: "scenic-2",
        departureTime: "15:00",
        arrivalTime: "17:15",
        availableSeats: 30,
        totalSeats: 40,
        date: "2024-01-15",
      },
    ],
  },
];
