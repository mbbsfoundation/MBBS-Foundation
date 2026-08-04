export type ZoneName =
  | "East Zone"
  | "West Zone"
  | "North Zone"
  | "South Zone"
  | "Central Zone";

export type StateMapItem = {
  name: string;
  zone: ZoneName;
  districts: string[];
};

export const ZONES: ZoneName[] = [
  "East Zone",
  "West Zone",
  "North Zone",
  "South Zone",
  "Central Zone",
];

export const STATES_AND_ZONES: StateMapItem[] = [
  // 1. East Zone (12 States / UTs)
  {
    name: "Arunachal Pradesh",
    zone: "East Zone",
    districts: ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang", "Itanagar"],
  },
  {
    name: "Assam",
    zone: "East Zone",
    districts: ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Dima Hasao", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  },
  {
    name: "Bihar",
    zone: "East Zone",
    districts: ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  },
  {
    name: "Jharkhand",
    zone: "East Zone",
    districts: ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  },
  {
    name: "Manipur",
    zone: "East Zone",
    districts: ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  },
  {
    name: "Meghalaya",
    zone: "East Zone",
    districts: ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills", "Eastern West Khasi Hills", "Shillong"],
  },
  {
    name: "Mizoram",
    zone: "East Zone",
    districts: ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
  },
  {
    name: "Nagaland",
    zone: "East Zone",
    districts: ["Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tuensang", "Wokha", "Zunheboto"],
  },
  {
    name: "Odisha",
    zone: "East Zone",
    districts: ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghapur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundergarh"],
  },
  {
    name: "Sikkim",
    zone: "East Zone",
    districts: ["Gangtok", "Gyalshing", "Pakyong", "Soreng", "Mangan", "Namchi"],
  },
  {
    name: "Tripura",
    zone: "East Zone",
    districts: ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura", "Agartala"],
  },
  {
    name: "West Bengal",
    zone: "East Zone",
    districts: ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  },

  // 2. West Zone (4 States / UTs)
  {
    name: "Maharashtra",
    zone: "West Zone",
    districts: ["Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhaji Nagar", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  },
  {
    name: "Gujarat",
    zone: "West Zone",
    districts: ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  },
  {
    name: "Goa",
    zone: "West Zone",
    districts: ["North Goa", "South Goa"],
  },
  {
    name: "Dadra and Nagar Haveli, Daman and Diu",
    zone: "West Zone",
    districts: ["Daman", "Diu", "Dadra and Nagar Haveli"],
  },

  // 3. North Zone (8 States / UTs)
  {
    name: "Jammu & Kashmir",
    zone: "North Zone",
    districts: ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  },
  {
    name: "Ladakh",
    zone: "North Zone",
    districts: ["Kargil", "Leh"],
  },
  {
    name: "Rajasthan",
    zone: "North Zone",
    districts: ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  },
  {
    name: "Punjab",
    zone: "North Zone",
    districts: ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"],
  },
  {
    name: "Delhi",
    zone: "North Zone",
    districts: ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  },
  {
    name: "Himachal Pradesh",
    zone: "North Zone",
    districts: ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  },
  {
    name: "Chandigarh",
    zone: "North Zone",
    districts: ["Chandigarh"],
  },
  {
    name: "Haryana",
    zone: "North Zone",
    districts: ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  },
  {
    name: "Uttarakhand",
    zone: "North Zone",
    districts: ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  },

  // 4. South Zone (6 States / UTs)
  {
    name: "Kerala",
    zone: "South Zone",
    districts: ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  },
  {
    name: "Tamil Nadu",
    zone: "South Zone",
    districts: ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  },
  {
    name: "Karnataka",
    zone: "South Zone",
    districts: ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"],
  },
  {
    name: "Puducherry",
    zone: "South Zone",
    districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  },
  {
    name: "Andaman and Nicobar",
    zone: "South Zone",
    districts: ["Nicobar", "North and Middle Andaman", "South Andaman"],
  },
  {
    name: "Lakshadweep",
    zone: "South Zone",
    districts: ["Lakshadweep"],
  },

  // 5. Central Zone (5 States / UTs)
  {
    name: "Andhra Pradesh",
    zone: "Central Zone",
    districts: ["Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", "Chittoor", "East Godavari", "Eluru", "Guntur", "Kakinada", "Konaseema", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  },
  {
    name: "Telangana",
    zone: "Central Zone",
    districts: ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Hanamkonda", "Yadadri Bhuvanagiri"],
  },
  {
    name: "Madhya Pradesh",
    zone: "Central Zone",
    districts: ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  },
  {
    name: "Chhattisgarh",
    zone: "Central Zone",
    districts: ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  },
  {
    name: "Uttar Pradesh",
    zone: "Central Zone",
    districts: ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  },
];

// Helper to look up Zone, State & District by 6-digit PIN code prefix
export function lookupLocationByPinCode(pin: string): {
  zone: ZoneName;
  state: string;
  district: string;
} | null {
  const cleanPin = pin.trim().replace(/\D/g, "");
  if (cleanPin.length < 2) return null;

  const prefix2 = cleanPin.substring(0, 2);

  // Updated PIN code prefix mapping reflecting the 5 exact Zones
  switch (prefix2) {
    case "11":
      return { zone: "North Zone", state: "Delhi", district: "New Delhi" };
    case "12":
    case "13":
      return { zone: "North Zone", state: "Haryana", district: "Gurugram" };
    case "14":
    case "15":
    case "16":
      return { zone: "North Zone", state: "Punjab", district: "Amritsar" };
    case "17":
      return { zone: "North Zone", state: "Himachal Pradesh", district: "Shimla" };
    case "18":
    case "19":
      return { zone: "North Zone", state: "Jammu & Kashmir", district: "Srinagar" };
    case "20":
    case "21":
    case "22":
    case "23":
    case "25":
    case "26":
    case "27":
    case "28":
      return { zone: "Central Zone", state: "Uttar Pradesh", district: "Lucknow" };
    case "24":
      return { zone: "North Zone", state: "Uttarakhand", district: "Dehradun" };
    case "30":
    case "31":
    case "32":
    case "33":
    case "34":
      return { zone: "North Zone", state: "Rajasthan", district: "Jaipur" };
    case "36":
    case "37":
    case "38":
    case "39":
      return { zone: "West Zone", state: "Gujarat", district: "Ahmedabad" };
    case "40":
    case "41":
    case "42":
    case "43":
    case "44":
      return { zone: "West Zone", state: "Maharashtra", district: "Mumbai City" };
    case "45":
    case "46":
    case "47":
    case "48":
      return { zone: "Central Zone", state: "Madhya Pradesh", district: "Bhopal" };
    case "49":
      return { zone: "Central Zone", state: "Chhattisgarh", district: "Raipur" };
    case "50":
      return { zone: "Central Zone", state: "Telangana", district: "Hyderabad" };
    case "51":
    case "52":
    case "53":
      return { zone: "Central Zone", state: "Andhra Pradesh", district: "Visakhapatnam" };
    case "56":
    case "57":
    case "58":
    case "59":
      return { zone: "South Zone", state: "Karnataka", district: "Bengaluru Urban" };
    case "60":
    case "61":
    case "62":
    case "63":
    case "64":
      return { zone: "South Zone", state: "Tamil Nadu", district: "Chennai" };
    case "67":
    case "68":
    case "69":
      return { zone: "South Zone", state: "Kerala", district: "Thiruvananthapuram" };
    case "70":
    case "71":
    case "72":
    case "73":
    case "74":
      return { zone: "East Zone", state: "West Bengal", district: "Kolkata" };
    case "75":
    case "76":
    case "77":
      return { zone: "East Zone", state: "Odisha", district: "Khordha" };
    case "78":
    case "79":
      return { zone: "East Zone", state: "Assam", district: "Kamrup Metropolitan" };
    case "80":
    case "81":
    case "82":
    case "83":
    case "84":
    case "85":
      return { zone: "East Zone", state: "Bihar", district: "Patna" };
  }

  return null;
}
