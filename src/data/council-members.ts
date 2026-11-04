/**
 * COUNCIL DEPARTMENT DETAILS - OFFICIAL ROSTER
 * Source: Council Department Details Document (Technical, Operations & Finance, Graphic Design, Promotions & Sponsorship, Photography & Media, Content, Creatives)
 * Each student's Roll Number acts as their authorized Confirmation Number (CNF) for Premium Pass verification, registration, and login.
 */

export interface CouncilMember {
  department: string;
  sNo: number;
  name: string;
  yrBranch: string;
  section: string;
  rollNo: string;
}

export const COUNCIL_MEMBERS: CouncilMember[] = [
  // Technical (25)
  { department: "Technical", sNo: 1, name: "K. GHANASHYAM", yrBranch: "IV-CSE", section: "D", rollNo: "23R21A05M8" },
  { department: "Technical", sNo: 2, name: "JAGATHI TEJA", yrBranch: "IV-CSD", section: "A", rollNo: "23R21A6721" },
  { department: "Technical", sNo: 3, name: "KEERTAN KUPPILI", yrBranch: "IV-IT", section: "B", rollNo: "23R21A1285" },
  { department: "Technical", sNo: 4, name: "KATEPALLY TRIBHUVAN", yrBranch: "III-CSE", section: "F", rollNo: "24R21A05HG" },
  { department: "Technical", sNo: 5, name: "A.SRI PAVAN", yrBranch: "III-CSE", section: "F", rollNo: "24R21A05GW" },
  { department: "Technical", sNo: 6, name: "ABHIRAM GANJI", yrBranch: "III-CSE", section: "G", rollNo: "24R21A05JN" },
  { department: "Technical", sNo: 7, name: "G.YASHWANTH ABHISHEK", yrBranch: "III-CSD", section: "B", rollNo: "24R21A6779" },
  { department: "Technical", sNo: 8, name: "ABHINAV SAI G", yrBranch: "III-CSD", section: "B", rollNo: "24R21A6778" },
  { department: "Technical", sNo: 9, name: "GANNOJI VEDIK", yrBranch: "III-CSD", section: "B", rollNo: "24R21A6771" },
  { department: "Technical", sNo: 10, name: "ANAMIKA KUMARI", yrBranch: "III-CSD", section: "C", rollNo: "24R21A67D2" },
  { department: "Technical", sNo: 11, name: "G.ADITHYA JADHAV", yrBranch: "III-CSM", section: "A", rollNo: "24R21A6619" },
  { department: "Technical", sNo: 12, name: "M GUNA SAI", yrBranch: "III-ECE", section: "B", rollNo: "24R21A04A4" },
  { department: "Technical", sNo: 13, name: "M S V S JAIKAR", yrBranch: "III-MECH", section: "", rollNo: "24R21A0314" },
  { department: "Technical", sNo: 14, name: "SAI RUTHWIK", yrBranch: "II-CSE", section: "B", rollNo: "25A21A0589" },
  { department: "Technical", sNo: 15, name: "GOUDA AGASTHYA", yrBranch: "II-CSE", section: "C", rollNo: "25R21A05BH" },
  { department: "Technical", sNo: 16, name: "RAMYA HARINI VEMPARALA", yrBranch: "II-CSE", section: "G", rollNo: "25R21A05LG" },
  { department: "Technical", sNo: 17, name: "MANAS VIGNESH", yrBranch: "II-CSD", section: "A", rollNo: "25R21A6763" },
  { department: "Technical", sNo: 18, name: "RITHWIK CHENDRA T", yrBranch: "II-CSD", section: "B", rollNo: "25R21A67B3" },
  { department: "Technical", sNo: 19, name: "NAGA ANSHU P", yrBranch: "II-CSD", section: "C", rollNo: "25R21A67G9" },
  { department: "Technical", sNo: 20, name: "HIMASRI KAMEPALLY", yrBranch: "II-CSM", section: "A", rollNo: "25R21A6620" },
  { department: "Technical", sNo: 21, name: "NITHYA NUNAVATH", yrBranch: "II-CSM", section: "A", rollNo: "25R21A6644" },
  { department: "Technical", sNo: 22, name: "MD FAIZAAN AHMED", yrBranch: "II-ECE", section: "A", rollNo: "25R21A0426" },
  { department: "Technical", sNo: 23, name: "GUNTRU SREECHARAN", yrBranch: "II-ECE", section: "B", rollNo: "25R21A0488" },
  { department: "Technical", sNo: 24, name: "ABHIRAM CHANDRA K", yrBranch: "II-ECE", section: "B", rollNo: "25R21A0498" },
  { department: "Technical", sNo: 25, name: "P BAALA SHANMUKHA SARMA", yrBranch: "II-ECE", section: "B", rollNo: "25R21A04A4" },

  // Operations & Finance (14)
  { department: "Operations & Finance", sNo: 1, name: "D.SATYA DURGA VINAY", yrBranch: "IV-CSE", section: "E", rollNo: "23R21A05U2" },
  { department: "Operations & Finance", sNo: 2, name: "MAHIMA TATINENI", yrBranch: "IV-CSD", section: "A", rollNo: "23R21A6759" },
  { department: "Operations & Finance", sNo: 3, name: "S.DHEERAJ KUMAR", yrBranch: "IV-CSD", section: "C", rollNo: "23R21A67J5" },
  { department: "Operations & Finance", sNo: 4, name: "AARTHI REDDY", yrBranch: "IV-CSM", section: "B", rollNo: "23R21A6667" },
  { department: "Operations & Finance", sNo: 5, name: "A.SAI GANESH", yrBranch: "III-CSE", section: "A", rollNo: "24R21A0503" },
  { department: "Operations & Finance", sNo: 6, name: "MARICHERLA VASANTH VARDHAN", yrBranch: "III-CSE", section: "A", rollNo: "24R21A0545" },
  { department: "Operations & Finance", sNo: 7, name: "BHAVANA", yrBranch: "III-CSE", section: "G", rollNo: "24R21A05K8" },
  { department: "Operations & Finance", sNo: 8, name: "E.THARUN", yrBranch: "III-CSD", section: "C", rollNo: "24R21A67E9" },
  { department: "Operations & Finance", sNo: 9, name: "M.TARUN KUMAR REDDY", yrBranch: "III-ECE", section: "A", rollNo: "24R21A0431" },
  { department: "Operations & Finance", sNo: 10, name: "ANURAG YADAV YENUGONDA", yrBranch: "II-CSE", section: "B", rollNo: "25R21A0571" },
  { department: "Operations & Finance", sNo: 11, name: "CHETTY SHREYAS GOUD", yrBranch: "II-CSE", section: "C", rollNo: "25R21A05B7" },
  { department: "Operations & Finance", sNo: 12, name: "MOULYA PALADUGU", yrBranch: "II-CSE", section: "E", rollNo: "25R21A05G6" },
  { department: "Operations & Finance", sNo: 13, name: "BAPATLA PRAJITH", yrBranch: "II-CSM", section: "A", rollNo: "25R21A6607" },
  { department: "Operations & Finance", sNo: 14, name: "MANASVI NANNEPAMULA", yrBranch: "II-ECE", section: "A", rollNo: "25R21A0429" },

  // Graphic Design (17)
  { department: "Graphic Design", sNo: 1, name: "SRITHEJITHA", yrBranch: "IV-CSE", section: "C", rollNo: "23R21A05G5" },
  { department: "Graphic Design", sNo: 2, name: "A.CHANIKYA", yrBranch: "IV-CSE", section: "F", rollNo: "23R21A05Z4" },
  { department: "Graphic Design", sNo: 3, name: "VIVEK VARDHAN", yrBranch: "IV-CSE", section: "F", rollNo: "23R21A05BE" },
  { department: "Graphic Design", sNo: 4, name: "VENKATA SAI AVINASH", yrBranch: "IV-IT", section: "D", rollNo: "23R21A12Q5" },
  { department: "Graphic Design", sNo: 5, name: "A.MOUNITH VARMA", yrBranch: "III-CSE", section: "A", rollNo: "24R21A0502" },
  { department: "Graphic Design", sNo: 6, name: "YERUVA INDUSRI VARSHITHA REDDY", yrBranch: "III-CSE", section: "B", rollNo: "24R21A05AW" },
  { department: "Graphic Design", sNo: 7, name: "PRANAV CHANDRA KODALI", yrBranch: "III-CSE", section: "B", rollNo: "24R21A05AD" },
  { department: "Graphic Design", sNo: 8, name: "A.FARHANA SULTANA", yrBranch: "III-CSE", section: "D", rollNo: "24R21A05CV" },
  { department: "Graphic Design", sNo: 9, name: "TANNIDI DURGA KARTHIKEYA", yrBranch: "III-CSE", section: "E", rollNo: "24R21A05FA" },
  { department: "Graphic Design", sNo: 10, name: "P RAJAVIVEK", yrBranch: "III-CSD", section: "C", rollNo: "24R21A67J0" },
  { department: "Graphic Design", sNo: 11, name: "BANGARI NIKITHA", yrBranch: "III-CSM", section: "B", rollNo: "24R21A6670" },
  { department: "Graphic Design", sNo: 12, name: "VEERA SAI AKHIL", yrBranch: "II-CSE", section: "E", rollNo: "25R21A05EU" },
  { department: "Graphic Design", sNo: 13, name: "N CHAITANYA", yrBranch: "II-CSE", section: "E", rollNo: "25R21A05G5" },
  { department: "Graphic Design", sNo: 14, name: "SIVANENI VENKATA VEERA SRI GANGADHAR", yrBranch: "II-CSE", section: "G", rollNo: "25R21A05LL" },
  { department: "Graphic Design", sNo: 15, name: "KAMAL PANDA", yrBranch: "II-CSM", section: "A", rollNo: "25R21A6624" },
  { department: "Graphic Design", sNo: 16, name: "VATRAPU JYOSHNIKA REDDY", yrBranch: "II-CSM", section: "C", rollNo: "25R21A66K0" },
  { department: "Graphic Design", sNo: 17, name: "SRI TEJASWI ABBU", yrBranch: "II-EEE", section: "", rollNo: "25R21A0202" },

  // Promotions & Sponsorship (10)
  { department: "Promotions & Sponsorship", sNo: 1, name: "BANDARU MAHITH", yrBranch: "IV-CSE", section: "D", rollNo: "23R21A05K9" },
  { department: "Promotions & Sponsorship", sNo: 2, name: "YASHASHRI PENIKALAPATI", yrBranch: "IV-CSM", section: "A", rollNo: "23R21A6661" },
  { department: "Promotions & Sponsorship", sNo: 3, name: "A.RITHISH KUMAR", yrBranch: "III-CSE", section: "A", rollNo: "24R21A0505" },
  { department: "Promotions & Sponsorship", sNo: 4, name: "K.ADITHYA GANESH", yrBranch: "III-CSE", section: "B", rollNo: "24R21A0596" },
  { department: "Promotions & Sponsorship", sNo: 5, name: "VENKATA SANJANA KOVURU", yrBranch: "III-CSE", section: "E", rollNo: "24R21A05GM" },
  { department: "Promotions & Sponsorship", sNo: 6, name: "GOGULA VINAY REDDY", yrBranch: "II-CSE", section: "C", rollNo: "25R21A05BE" },
  { department: "Promotions & Sponsorship", sNo: 7, name: "PEDDAHOTHUR SANIYA", yrBranch: "II-CSE", section: "E", rollNo: "25R21A05G9" },
  { department: "Promotions & Sponsorship", sNo: 8, name: "TALLURI LAXMI PRASANNA", yrBranch: "II-ECE", section: "B", rollNo: "25R21A04C0" },
  { department: "Promotions & Sponsorship", sNo: 9, name: "KOJAGORI BISWAS", yrBranch: "II-AERO", section: "", rollNo: "25R21A2131" },
  { department: "Promotions & Sponsorship", sNo: 10, name: "KARLAPUDI GOUTHAM KUMAR", yrBranch: "II-MECH", section: "", rollNo: "25R21A0332" },

  // Photography & Media (15)
  { department: "Photography & Media", sNo: 1, name: "PRIYANSHU ROY", yrBranch: "IV-CSE", section: "F", rollNo: "23R21A05BN" },
  { department: "Photography & Media", sNo: 2, name: "SHIVANI MATTAM", yrBranch: "IV-CSD", section: "A", rollNo: "23R21A6731" },
  { department: "Photography & Media", sNo: 3, name: "A.SHIVA", yrBranch: "IV-CSD", section: "C", rollNo: "23R21A67D3" },
  { department: "Photography & Media", sNo: 4, name: "VAVILALA SAI GANESH", yrBranch: "IV-CSD", section: "C", rollNo: "23R21A67K2" },
  { department: "Photography & Media", sNo: 5, name: "KONTHUM BHRUHATHI", yrBranch: "III-CSE", section: "A", rollNo: "24R21A0537" },
  { department: "Photography & Media", sNo: 6, name: "RISHITH GOTHURI", yrBranch: "III-CSE", section: "B", rollNo: "24R21A0587" },
  { department: "Photography & Media", sNo: 7, name: "ANAM MOUNIKA REDDY", yrBranch: "III-CSE", section: "E", rollNo: "24R21A05EW" },
  { department: "Photography & Media", sNo: 8, name: "D.SAI VASHIST", yrBranch: "III-CSE", section: "F", rollNo: "24R21A05H4" },
  { department: "Photography & Media", sNo: 9, name: "GORLI MAHESH", yrBranch: "III-CSD", section: "B", rollNo: "24R21A6773" },
  { department: "Photography & Media", sNo: 10, name: "K SAI VARSHITH", yrBranch: "III-ECE", section: "B", rollNo: "24R21A0489" },
  { department: "Photography & Media", sNo: 11, name: "YASHWANTH SAI PATHI", yrBranch: "II-CSE", section: "C", rollNo: "25R21A05C5" },
  { department: "Photography & Media", sNo: 12, name: "CHAKRALA SAHASRA", yrBranch: "II-CSE", section: "E", rollNo: "25R21A05F5" },
  { department: "Photography & Media", sNo: 13, name: "ANGALA MAHESH", yrBranch: "II-CSE", section: "F", rollNo: "25R21A05GT" },
  { department: "Photography & Media", sNo: 14, name: "VADLA VARDHAN", yrBranch: "II-CSE", section: "G", rollNo: "25R21A05LE" },
  { department: "Photography & Media", sNo: 15, name: "NACHARAM PRANEETH", yrBranch: "II-CSM", section: "A", rollNo: "25R21A6640" },

  // Content (11)
  { department: "Content", sNo: 1, name: "T.JAYADEEP", yrBranch: "IV-CSD", section: "A", rollNo: "23R21A6757" },
  { department: "Content", sNo: 2, name: "PRASHANSA", yrBranch: "IV-CSM", section: "A", rollNo: "23R21A6611" },
  { department: "Content", sNo: 3, name: "BOLLEPALLI HARSHITHA", yrBranch: "III-CSE", section: "D", rollNo: "24R21A05D6" },
  { department: "Content", sNo: 4, name: "K.S SREESANTH", yrBranch: "III-CSD", section: "A", rollNo: "24R21A6725" },
  { department: "Content", sNo: 5, name: "ENNAWAR RITHVIK", yrBranch: "III-CSD", section: "A", rollNo: "24R21A6714" },
  { department: "Content", sNo: 6, name: "SHIVA", yrBranch: "III-ECE", section: "B", rollNo: "24R21A0487" },
  { department: "Content", sNo: 7, name: "B SATHVIKA", yrBranch: "II-CSE", section: "A", rollNo: "25R21A0511" },
  { department: "Content", sNo: 8, name: "BANDI KUMAR SWAMY", yrBranch: "II-CSE", section: "A", rollNo: "25R21A6707" },
  { department: "Content", sNo: 9, name: "SUPRITHA REDDY", yrBranch: "II-CSD", section: "B", rollNo: "25R21A6787" },
  { department: "Content", sNo: 10, name: "SAI CHARAN", yrBranch: "II-CSM", section: "B", rollNo: "25R21A66B6" },
  { department: "Content", sNo: 11, name: "TANUSHREE", yrBranch: "II-ECE", section: "B", rollNo: "25R21A0485" },

  // Creatives (12)
  { department: "Creatives", sNo: 1, name: "V SAI KRISHNA", yrBranch: "IV-CSE", section: "A", rollNo: "23R21A0562" },
  { department: "Creatives", sNo: 2, name: "Y.HARIKA", yrBranch: "IV-CSE", section: "A", rollNo: "23R21A0565" },
  { department: "Creatives", sNo: 3, name: "M SUSHAANTH BABU", yrBranch: "IV-CSM", section: "A", rollNo: "23R21A6636" },
  { department: "Creatives", sNo: 4, name: "SADWIKA REDDY CH", yrBranch: "III-CSE", section: "A", rollNo: "24R21A0513" },
  { department: "Creatives", sNo: 5, name: "D. PEARL ANGELINA", yrBranch: "III-CSE", section: "B", rollNo: "24R21A0579" },
  { department: "Creatives", sNo: 6, name: "HANSIKA JELLA", yrBranch: "III-CSE", section: "B", rollNo: "24R21A0592" },
  { department: "Creatives", sNo: 7, name: "KOLUKURI DURGAMAHESH", yrBranch: "III-CSE", section: "C", rollNo: "24R21A05BT" },
  { department: "Creatives", sNo: 8, name: "CHEEDA SHAMILINI NAIDU", yrBranch: "III-CSE", section: "D", rollNo: "24R21A05DB" },
  { department: "Creatives", sNo: 9, name: "RATNAVATH SANDHYA", yrBranch: "II-CSE", section: "A", rollNo: "25R21A0558" },
  { department: "Creatives", sNo: 10, name: "SAANVI MANCHOLLA", yrBranch: "II-CSD", section: "B", rollNo: "25R21A6798" },
  { department: "Creatives", sNo: 11, name: "LOKESH SHARMA", yrBranch: "II-ECE", section: "A", rollNo: "25R21A0418" },
  { department: "Creatives", sNo: 12, name: "SAI SUSMITA NANDURI", yrBranch: "II-ECE", section: "A", rollNo: "25R21A0442" }
];

export const COUNCIL_ROLL_MAP = new Map<string, CouncilMember>();
for (const m of COUNCIL_MEMBERS) {
  COUNCIL_ROLL_MAP.set(m.rollNo.toUpperCase(), m);
}

export function getCouncilMemberByRollNo(rollNo: string): CouncilMember | undefined {
  if (!rollNo) return undefined;
  return COUNCIL_ROLL_MAP.get(rollNo.trim().toUpperCase());
}

