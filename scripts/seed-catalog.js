const https = require('https');

const SUPABASE_URL = 'https://qcahdvbzfhqmdpfiquzc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYWhkdmJ6ZmhxbWRwZmlxdXpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUwMzU4NCwiZXhwIjoyMDg5MDc5NTg0fQ.HXUCcPGxPP8Wgv2oaGTLZ_Psp7th_D1RKfMjpAAqSaM';
const USER_ID = 'fc7c5cb3-93aa-4be5-bfdb-b3ab7df3b58c';

const newCars = [
  {
    item_name: "Creta",
    category: "Diesel",
    price: 1120000,
    quantity: 1,
    description: "Creta, a Diesel, with Hyundai, 2021, Manual, White, 1st Owner, 38500, registration city: Pune, insurance valid till: 2027-03-31, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 75%, battery condition: Excellent, features: Sunroof, Wireless Charging, Connected Car Tech, Ventilated Seats, Rear Camera, Auto AC, description: Top variant with sunroof and all features intact. Single owner, showroom maintained., priced at 11.2 lakhs",
    attributes: { make: "Hyundai", model: "Creta SX(O)", year: "2021", fuel_type: "Diesel", transmission: "Manual", color: "White", ownership: "1st Owner", kilometers_driven: "38500", registration_city: "Pune", insurance_valid_till: "2027-03-31", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "75%", battery_condition: "Excellent", features: "Sunroof, Wireless Charging, Connected Car Tech, Ventilated Seats, Rear Camera, Auto AC" }
  },
  {
    item_name: "Creta",
    category: "Petrol",
    price: 985000,
    quantity: 1,
    description: "Creta, a Petrol, with Hyundai, 2020, Automatic, Silver, 1st Owner, 42100, registration city: Mumbai, insurance valid till: 2027-01-15, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 70%, battery condition: Good, features: Rear Camera, Auto AC, Alloy Wheels, Bluetooth, description: Well-maintained petrol automatic variant. Perfect for city driving., priced at 9.85 lakhs",
    attributes: { make: "Hyundai", model: "Creta SX", year: "2020", fuel_type: "Petrol", transmission: "Automatic", color: "Silver", ownership: "1st Owner", kilometers_driven: "42100", registration_city: "Mumbai", insurance_valid_till: "2027-01-15", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "70%", battery_condition: "Good", features: "Rear Camera, Auto AC, Alloy Wheels, Bluetooth" }
  },
  {
    item_name: "Venue",
    category: "Petrol",
    price: 785000,
    quantity: 1,
    description: "Venue, a Petrol, with Hyundai, 2021, Manual, Blue, 1st Owner, 29800, registration city: Pune, insurance valid till: 2027-05-20, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 80%, battery condition: Excellent, features: Touchscreen, Apple CarPlay, Rear Camera, ABS, Dual Airbags, description: Compact SUV in excellent condition. Low km, single owner., priced at 7.85 lakhs",
    attributes: { make: "Hyundai", model: "Venue SX", year: "2021", fuel_type: "Petrol", transmission: "Manual", color: "Blue", ownership: "1st Owner", kilometers_driven: "29800", registration_city: "Pune", insurance_valid_till: "2027-05-20", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "80%", battery_condition: "Excellent", features: "Touchscreen, Apple CarPlay, Rear Camera, ABS, Dual Airbags" }
  },
  {
    item_name: "Baleno",
    category: "Petrol",
    price: 625000,
    quantity: 1,
    description: "Baleno, a Petrol, with Maruti, 2021, Manual, White, 1st Owner, 31200, registration city: Pune, insurance valid till: 2027-02-28, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 75%, battery condition: Good, features: Touchscreen, Android Auto, Apple CarPlay, Rear Camera, LED Headlamps, description: Premium hatchback with very low running. Fuel efficient and spacious., priced at 6.25 lakhs",
    attributes: { make: "Maruti", model: "Baleno Zeta", year: "2021", fuel_type: "Petrol", transmission: "Manual", color: "White", ownership: "1st Owner", kilometers_driven: "31200", registration_city: "Pune", insurance_valid_till: "2027-02-28", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "75%", battery_condition: "Good", features: "Touchscreen, Android Auto, Apple CarPlay, Rear Camera, LED Headlamps" }
  },
  {
    item_name: "Wagon R",
    category: "Petrol + CNG",
    price: 498000,
    quantity: 1,
    description: "Wagon R, a Petrol + CNG, with Maruti, 2020, Manual, White, 2nd Owner, 52400, registration city: Pune, insurance valid till: 2026-11-30, rc status: Clean, service history: Local Garage + ASC Mixed, accidental: No, tyre condition: 60%, battery condition: Good, features: CNG Kit (Company Fitted), Power Steering, Central Locking, description: Dual fuel CNG car. Very low running cost. Ideal for daily commute., priced at 4.98 lakhs",
    attributes: { make: "Maruti", model: "Wagon R ZXI", year: "2020", fuel_type: "Petrol + CNG", transmission: "Manual", color: "White", ownership: "2nd Owner", kilometers_driven: "52400", registration_city: "Pune", insurance_valid_till: "2026-11-30", rc_status: "Clean", service_history: "Local Garage + ASC Mixed", accidental: "No", tyre_condition: "60%", battery_condition: "Good", features: "CNG Kit (Company Fitted), Power Steering, Central Locking" }
  },
  {
    item_name: "Brezza",
    category: "Petrol",
    price: 895000,
    quantity: 1,
    description: "Brezza, a Petrol, with Maruti, 2022, Automatic, Red, 1st Owner, 22100, registration city: Pune, insurance valid till: 2027-08-15, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 85%, battery condition: Excellent, features: Sunroof, Head-Up Display, 360 Camera, Wireless Charging, Auto AC, 6 Airbags, description: Almost new compact SUV. Top variant with all safety features., priced at 8.95 lakhs",
    attributes: { make: "Maruti", model: "Brezza ZXI+", year: "2022", fuel_type: "Petrol", transmission: "Automatic", color: "Red", ownership: "1st Owner", kilometers_driven: "22100", registration_city: "Pune", insurance_valid_till: "2027-08-15", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "85%", battery_condition: "Excellent", features: "Sunroof, Head-Up Display, 360 Camera, Wireless Charging, Auto AC, 6 Airbags" }
  },
  {
    item_name: "Nexon XZA+",
    category: "Petrol",
    price: 825000,
    quantity: 1,
    description: "Nexon XZA+, a Petrol, with Tata, 2022, Manual, Grey, 1st Owner, 25600, registration city: Pune, insurance valid till: 2027-04-30, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 80%, battery condition: Excellent, features: Touchscreen, Wireless Android Auto, Ventilated Seats, Auto AC, 6 Airbags, description: 5-star GNCAP rated safest compact SUV. Top variant with ventilated seats., priced at 8.25 lakhs",
    attributes: { make: "Tata", model: "Nexon XZA+", year: "2022", fuel_type: "Petrol", transmission: "Manual", color: "Grey", ownership: "1st Owner", kilometers_driven: "25600", registration_city: "Pune", insurance_valid_till: "2027-04-30", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "80%", battery_condition: "Excellent", features: "Touchscreen, Wireless Android Auto, Ventilated Seats, Auto AC, 6 Airbags", safety_rating: "5-star GNCAP" }
  },
  {
    item_name: "Fortuner",
    category: "Diesel",
    price: 2850000,
    quantity: 1,
    description: "Fortuner, a Diesel, with Toyota, 2020, Automatic, White, 1st Owner, 58200, registration city: Mumbai, insurance valid till: 2027-02-28, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 65%, battery condition: Good, features: 4x4, Leather Seats, Cruise Control, 7 Seater, Touchscreen, Rear AC, description: Premium full-size SUV. 4x4 variant with complete service records., priced at 28.5 lakhs",
    attributes: { make: "Toyota", model: "Fortuner 4x4 AT", year: "2020", fuel_type: "Diesel", transmission: "Automatic", color: "White", ownership: "1st Owner", kilometers_driven: "58200", registration_city: "Mumbai", insurance_valid_till: "2027-02-28", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "65%", battery_condition: "Good", features: "4x4, Leather Seats, Cruise Control, 7 Seater, Touchscreen, Rear AC" }
  },
  {
    item_name: "Ertiga",
    category: "Petrol + CNG",
    price: 895000,
    quantity: 1,
    description: "Ertiga, a Petrol + CNG, with Maruti, 2021, Manual, Silver, 1st Owner, 44800, registration city: Pune, insurance valid till: 2027-01-15, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 70%, battery condition: Good, features: 7 Seater, Touchscreen, Rear AC, ABS, Dual Airbags, CNG Kit (Company Fitted), description: Family MPV with factory CNG. Best in class running cost for 7 seater., priced at 8.95 lakhs",
    attributes: { make: "Maruti", model: "Ertiga VXI CNG", year: "2021", fuel_type: "Petrol + CNG", transmission: "Manual", color: "Silver", ownership: "1st Owner", kilometers_driven: "44800", registration_city: "Pune", insurance_valid_till: "2027-01-15", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "70%", battery_condition: "Good", features: "7 Seater, Touchscreen, Rear AC, ABS, Dual Airbags, CNG Kit (Company Fitted)" }
  },
  {
    item_name: "Alto K10",
    category: "Petrol",
    price: 298000,
    quantity: 1,
    description: "Alto K10, a Petrol, with Maruti, 2019, Manual, White, 2nd Owner, 48200, registration city: Pune, insurance valid till: 2026-09-30, rc status: Clean, service history: Local Garage, accidental: No, tyre condition: 55%, battery condition: Good, features: Power Steering, AC, Music System, description: Most affordable entry-level car. Very low maintenance cost., priced at 2.98 lakhs",
    attributes: { make: "Maruti", model: "Alto K10 VXI", year: "2019", fuel_type: "Petrol", transmission: "Manual", color: "White", ownership: "2nd Owner", kilometers_driven: "48200", registration_city: "Pune", insurance_valid_till: "2026-09-30", rc_status: "Clean", service_history: "Local Garage", accidental: "No", tyre_condition: "55%", battery_condition: "Good", features: "Power Steering, AC, Music System" }
  },
  {
    item_name: "Dzire",
    category: "Petrol",
    price: 595000,
    quantity: 1,
    description: "Dzire, a Petrol, with Maruti, 2020, Automatic, Silver, 1st Owner, 35600, registration city: Pune, insurance valid till: 2027-03-15, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 70%, battery condition: Good, features: Touchscreen, Android Auto, ABS, Dual Airbags, Rear Camera, description: Popular sedan with AMT gearbox. Very fuel efficient., priced at 5.95 lakhs",
    attributes: { make: "Maruti", model: "Dzire ZXI AMT", year: "2020", fuel_type: "Petrol", transmission: "Automatic", color: "Silver", ownership: "1st Owner", kilometers_driven: "35600", registration_city: "Pune", insurance_valid_till: "2027-03-15", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "70%", battery_condition: "Good", features: "Touchscreen, Android Auto, ABS, Dual Airbags, Rear Camera" }
  },
  {
    item_name: "Punch",
    category: "Petrol",
    price: 698000,
    quantity: 1,
    description: "Punch, a Petrol, with Tata, 2023, Manual, Orange, 1st Owner, 15200, registration city: Pune, insurance valid till: 2027-10-31, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 90%, battery condition: Excellent, features: Touchscreen, Connected Car, Projector Headlamps, ABS, Dual Airbags, description: Almost brand new micro-SUV. 5-star safety rated. Very low km., priced at 6.98 lakhs",
    attributes: { make: "Tata", model: "Punch Creative", year: "2023", fuel_type: "Petrol", transmission: "Manual", color: "Orange", ownership: "1st Owner", kilometers_driven: "15200", registration_city: "Pune", insurance_valid_till: "2027-10-31", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "90%", battery_condition: "Excellent", features: "Touchscreen, Connected Car, Projector Headlamps, ABS, Dual Airbags", safety_rating: "5-star GNCAP" }
  },
  {
    item_name: "XUV700",
    category: "Diesel",
    price: 1895000,
    quantity: 1,
    description: "XUV700, a Diesel, with Mahindra, 2022, Automatic, Blue, 1st Owner, 31200, registration city: Mumbai, insurance valid till: 2027-07-15, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 80%, battery condition: Excellent, features: ADAS, Sunroof, 360 Camera, Ventilated Seats, 7 Seater, AdrenoX Connected, description: Feature-loaded premium SUV with ADAS safety tech. Diesel automatic., priced at 18.95 lakhs",
    attributes: { make: "Mahindra", model: "XUV700 AX7 AT", year: "2022", fuel_type: "Diesel", transmission: "Automatic", color: "Blue", ownership: "1st Owner", kilometers_driven: "31200", registration_city: "Mumbai", insurance_valid_till: "2027-07-15", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "80%", battery_condition: "Excellent", features: "ADAS, Sunroof, 360 Camera, Ventilated Seats, 7 Seater, AdrenoX Connected", safety_rating: "5-star GNCAP" }
  },
  {
    item_name: "Verna",
    category: "Petrol",
    price: 925000,
    quantity: 1,
    description: "Verna, a Petrol, with Hyundai, 2020, Automatic, Black, 1st Owner, 38900, registration city: Pune, insurance valid till: 2027-01-31, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 70%, battery condition: Good, features: Sunroof, Ventilated Seats, Wireless Charging, Auto AC, Rear Camera, description: Premium sedan with sunroof. IVT automatic gearbox., priced at 9.25 lakhs",
    attributes: { make: "Hyundai", model: "Verna SX(O) IVT", year: "2020", fuel_type: "Petrol", transmission: "Automatic", color: "Black", ownership: "1st Owner", kilometers_driven: "38900", registration_city: "Pune", insurance_valid_till: "2027-01-31", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "70%", battery_condition: "Good", features: "Sunroof, Ventilated Seats, Wireless Charging, Auto AC, Rear Camera" }
  },
  {
    item_name: "WR-V",
    category: "Petrol",
    price: 715000,
    quantity: 1,
    description: "WR-V, a Petrol, with Honda, 2020, Manual, Red, 1st Owner, 33400, registration city: Pune, insurance valid till: 2026-12-31, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 70%, battery condition: Good, features: Touchscreen, Rear Camera, Sunroof, ABS, Dual Airbags, description: Crossover with Honda reliability. Excellent build quality., priced at 7.15 lakhs",
    attributes: { make: "Honda", model: "WR-V VX", year: "2020", fuel_type: "Petrol", transmission: "Manual", color: "Red", ownership: "1st Owner", kilometers_driven: "33400", registration_city: "Pune", insurance_valid_till: "2026-12-31", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "70%", battery_condition: "Good", features: "Touchscreen, Rear Camera, Sunroof, ABS, Dual Airbags" }
  },
  {
    item_name: "Ecosport",
    category: "Petrol",
    price: 645000,
    quantity: 1,
    description: "Ecosport, a Petrol, with Ford, 2019, Manual, White, 2nd Owner, 51200, registration city: Pune, insurance valid till: 2026-10-15, rc status: Clean, service history: Local Garage + ASC Mixed, accidental: No, tyre condition: 60%, battery condition: Good, features: Touchscreen, ABS, Dual Airbags, Rear Parking Sensors, description: Compact SUV with solid build. Known for safety and driving dynamics., priced at 6.45 lakhs",
    attributes: { make: "Ford", model: "Ecosport Titanium", year: "2019", fuel_type: "Petrol", transmission: "Manual", color: "White", ownership: "2nd Owner", kilometers_driven: "51200", registration_city: "Pune", insurance_valid_till: "2026-10-15", rc_status: "Clean", service_history: "Local Garage + ASC Mixed", accidental: "No", tyre_condition: "60%", battery_condition: "Good", features: "Touchscreen, ABS, Dual Airbags, Rear Parking Sensors" }
  },
  {
    item_name: "Amaze",
    category: "Petrol",
    price: 545000,
    quantity: 1,
    description: "Amaze, a Petrol, with Honda, 2019, Automatic, White, 1st Owner, 41500, registration city: Pune, insurance valid till: 2026-11-30, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 65%, battery condition: Good, features: CVT Gearbox, ABS, Dual Airbags, Rear Camera, description: Honda sedan with CVT automatic. Best in class boot space., priced at 5.45 lakhs",
    attributes: { make: "Honda", model: "Amaze VX CVT", year: "2019", fuel_type: "Petrol", transmission: "Automatic", color: "White", ownership: "1st Owner", kilometers_driven: "41500", registration_city: "Pune", insurance_valid_till: "2026-11-30", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "65%", battery_condition: "Good", features: "CVT Gearbox, ABS, Dual Airbags, Rear Camera" }
  },
  {
    item_name: "Harrier",
    category: "Diesel",
    price: 1625000,
    quantity: 1,
    description: "Harrier, a Diesel, with Tata, 2022, Automatic, White, 1st Owner, 28700, registration city: Pune, insurance valid till: 2027-06-30, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 80%, battery condition: Excellent, features: Panoramic Sunroof, JBL Sound System, 360 Camera, ADAS, Ventilated Seats, Auto AC, description: Premium SUV with Land Rover derived platform. Feature loaded., priced at 16.25 lakhs",
    attributes: { make: "Tata", model: "Harrier XZA+ Dark", year: "2022", fuel_type: "Diesel", transmission: "Automatic", color: "White", ownership: "1st Owner", kilometers_driven: "28700", registration_city: "Pune", insurance_valid_till: "2027-06-30", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "80%", battery_condition: "Excellent", features: "Panoramic Sunroof, JBL Sound System, 360 Camera, ADAS, Ventilated Seats, Auto AC" }
  },
  {
    item_name: "Sonet",
    category: "Diesel",
    price: 895000,
    quantity: 1,
    description: "Sonet, a Diesel, with Kia, 2021, Manual, White, 1st Owner, 35600, registration city: Pune, insurance valid till: 2027-03-31, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 75%, battery condition: Good, features: Touchscreen, UVO Connected, Ventilated Seats, Air Purifier, Rear Camera, description: Feature-rich compact SUV with diesel performance., priced at 8.95 lakhs",
    attributes: { make: "Kia", model: "Sonet HTX+", year: "2021", fuel_type: "Diesel", transmission: "Manual", color: "White", ownership: "1st Owner", kilometers_driven: "35600", registration_city: "Pune", insurance_valid_till: "2027-03-31", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "75%", battery_condition: "Good", features: "Touchscreen, UVO Connected, Ventilated Seats, Air Purifier, Rear Camera" }
  },
  {
    item_name: "Aura",
    category: "Petrol + CNG",
    price: 548000,
    quantity: 1,
    description: "Aura, a Petrol + CNG, with Hyundai, 2021, Manual, Silver, 1st Owner, 42300, registration city: Pune, insurance valid till: 2027-02-28, rc status: Clean, service history: Authorized Service Center, accidental: No, tyre condition: 65%, battery condition: Good, features: CNG Kit (Company Fitted), Touchscreen, Rear Camera, ABS, description: Compact sedan with factory CNG. Lowest running cost in sedan segment., priced at 5.48 lakhs",
    attributes: { make: "Hyundai", model: "Aura SX CNG", year: "2021", fuel_type: "Petrol + CNG", transmission: "Manual", color: "Silver", ownership: "1st Owner", kilometers_driven: "42300", registration_city: "Pune", insurance_valid_till: "2027-02-28", rc_status: "Clean", service_history: "Authorized Service Center", accidental: "No", tyre_condition: "65%", battery_condition: "Good", features: "CNG Kit (Company Fitted), Touchscreen, Rear Camera, ABS" }
  }
];

// Insert via Supabase REST API
const body = JSON.stringify(newCars.map(car => ({
  user_id: USER_ID,
  item_name: car.item_name,
  category: car.category,
  description: car.description,
  price: car.price,
  quantity: car.quantity,
  images: [],
  attributes: car.attributes,
  is_active: true,
})));

const url = new URL('/rest/v1/wb_catalog_items', SUPABASE_URL);
const options = {
  method: 'POST',
  hostname: url.hostname,
  path: url.pathname,
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Prefer': 'return=representation',
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 201) {
      const items = JSON.parse(data);
      console.log('SUCCESS: Inserted ' + items.length + ' new cars');
      items.forEach(i => console.log('  + ' + i.item_name + ' (' + i.category + ') - Rs ' + (i.price / 100000) + 'L'));
    } else {
      console.log('ERROR ' + res.statusCode + ':', data);
    }
  });
});

req.write(body);
req.end();
