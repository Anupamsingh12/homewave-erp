import type {
  Activity,
  Agreement,
  Booking,
  ChannelPartner,
  Commission,
  ConstructionMilestone,
  Customer,
  DocumentRecord,
  FollowUp,
  Invoice,
  Lead,
  LeadSource,
  LeadStatus,
  Payment,
  PaymentMode,
  PaymentPlan,
  Project,
  SiteVisit,
  Tower,
  Unit,
  User,
} from "@/types";

/** Fixed clock so SSR and client render identical seeded data. */
export const SEED_NOW = new Date("2026-08-31T09:00:00.000Z");

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rand = rng(20260831);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const iso = (days: number, hour = 10, minute = 0) => {
  const d = new Date(SEED_NOW);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
};

const FIRST = [
  "Rajesh","Priya","Amit","Sneha","Vikram","Ananya","Rohit","Kavita","Suresh","Meera",
  "Arjun","Divya","Karthik","Neha","Manish","Pooja","Sanjay","Ritu","Aditya","Shalini",
  "Nikhil","Swati","Harish","Deepika","Vivek","Lakshmi","Rahul","Anjali","Prakash","Ishita",
];
const LAST = [
  "Kumar","Sharma","Patel","Reddy","Iyer","Desai","Nair","Joshi","Mehta","Gupta",
  "Chopra","Rao","Bhatia","Menon","Kulkarni","Agarwal",
];
const CITIES = ["Mumbai", "Pune", "Bangalore", "Delhi NCR", "Hyderabad"];
const SOURCES: LeadSource[] = [
  "WEBSITE","WALK_IN","REFERRAL","CHANNEL_PARTNER","FACEBOOK","GOOGLE_ADS","PROPERTY_PORTAL","EXHIBITION",
];
const FACINGS = ["East", "West", "North", "North-East", "South-East", "Garden"];

let counter = 0;
const uid = (p: string) => `${p}_${(++counter).toString().padStart(4, "0")}`;
const stamp = (days: number) => ({ createdAt: iso(days), updatedAt: iso(days) });

export interface Database {
  users: User[];
  leads: Lead[];
  followUps: FollowUp[];
  siteVisits: SiteVisit[];
  customers: Customer[];
  projects: Project[];
  towers: Tower[];
  units: Unit[];
  bookings: Booking[];
  agreements: Agreement[];
  paymentPlans: PaymentPlan[];
  invoices: Invoice[];
  payments: Payment[];
  channelPartners: ChannelPartner[];
  commissions: Commission[];
  constructionMilestones: ConstructionMilestone[];
  documents: DocumentRecord[];
  activities: Activity[];
}

export function buildSeed(): Database {
  counter = 0;

  const users: User[] = [
    ["Anupam Kumar", "SUPER_ADMIN"],
    ["Rohan Mehta", "SALES_MANAGER"],
    ["Sneha Kulkarni", "SALES_EXECUTIVE"],
    ["Vikram Desai", "SALES_EXECUTIVE"],
    ["Nisha Agarwal", "ACCOUNTS"],
    ["Prakash Rao", "PROJECT_MANAGER"],
  ].map(([name, role], i) => ({
    id: `usr_${i + 1}`,
    ...stamp(-400),
    name: name as string,
    email: `${(name as string).split(" ")[0].toLowerCase()}@buildwell.in`,
    phone: `+91 9${int(100000000, 899999999)}`,
    role: role as User["role"],
    active: true,
  }));
  const salesUsers = users.filter((u) => u.role.startsWith("SALES"));

  const projectSeeds = [
    { name: "Green Heights", code: "GRH", city: "Mumbai", status: "ACTIVE" },
    { name: "Palm Residency", code: "PLR", city: "Pune", status: "ON_TRACK" },
    { name: "Skyline One", code: "SKY", city: "Bangalore", status: "DELAYED" },
    { name: "Urban Vista", code: "URV", city: "Hyderabad", status: "PLANNING" },
  ] as const;

  const projects: Project[] = projectSeeds.map((p, i) => ({
    id: `prj_${i + 1}`,
    ...stamp(-500 + i * 40),
    code: p.code,
    name: p.name,
    city: p.city,
    address: `Plot ${int(10, 90)}, Sector ${int(2, 40)}, ${p.city}`,
    developer: "Buildwell Developers Pvt. Ltd.",
    reraNumber: `P${int(50000, 59999)}${int(1000, 9999)}`,
    startDate: iso(-500 + i * 40),
    completionDate: iso(300 + i * 90),
    status: p.status,
    description: `${p.name} is a premium residential development in ${p.city} offering thoughtfully designed homes with modern amenities.`,
    archived: false,
  }));

  const towers: Tower[] = [];
  const units: Unit[] = [];
  projects.forEach((project, pi) => {
    const towerCount = pi === 3 ? 1 : pi === 0 ? 3 : 2;
    for (let t = 0; t < towerCount; t++) {
      const letter = String.fromCharCode(65 + t);
      const floors = pi === 3 ? 8 : int(10, 14);
      const upf = 4;
      const tower: Tower = {
        id: `twr_${towers.length + 1}`,
        ...stamp(-460 + pi * 30),
        code: `${project.code}-${letter}`,
        name: `Tower ${letter}`,
        projectId: project.id,
        floors,
        unitsPerFloor: upf,
        status: project.status,
      };
      towers.push(tower);
      for (let f = floors; f >= 1; f--) {
        for (let u = 1; u <= upf; u++) {
          const bhk = u === 1 || u === 4 ? 3 : 2;
          const carpet = bhk === 3 ? 1350 + int(0, 200) : 950 + int(0, 150);
          const rate = 9500 + pi * 900 + int(-300, 400);
          const base = Math.round((carpet * rate) / 1000) * 1000;
          const status =
            project.status === "PLANNING"
              ? rand() < 0.85
                ? "AVAILABLE"
                : "BLOCKED"
              : pick(["AVAILABLE", "AVAILABLE", "AVAILABLE", "HOLD", "BOOKED", "SOLD", "BLOCKED"] as const);
          units.push({
            id: `unt_${units.length + 1}`,
            ...stamp(-450 + pi * 25),
            code: `${letter}-${f}${u.toString().padStart(2, "0")}`,
            projectId: project.id,
            towerId: tower.id,
            floor: f,
            bhk,
            carpetArea: carpet,
            facing: pick(FACINGS),
            basePrice: base,
            plc: Math.round(base * 0.03),
            parking: 350000,
            floorRise: f * 25000,
            otherCharges: 175000,
            status,
            holdCustomerId: null,
            holdSalespersonId: null,
            holdUntil: null,
            holdReason: null,
          });
        }
      }
    }
  });

  const channelPartners: ChannelPartner[] = Array.from({ length: 10 }, (_, i) => ({
    id: `cnp_${i + 1}`,
    ...stamp(-380 + i * 8),
    code: `CP-${(1001 + i).toString()}`,
    company: [
      "Anmol Realty Advisors","Prime Space Consultants","Nova Property Hub","Skyward Realtors",
      "Aashray Homes LLP","Metro Key Realty","Vastu Sales Partners","Elite Nest Realty",
      "Shubh Realty Network","Cityscape Associates",
    ][i],
    contactPerson: `${pick(FIRST)} ${pick(LAST)}`,
    phone: `+91 9${int(100000000, 899999999)}`,
    email: `partner${i + 1}@channel.in`,
    reraNumber: `A${int(50000, 59999)}${int(100, 999)}`,
    commissionPct: [1.5, 2, 2.5, 3][int(0, 3)],
    city: pick(CITIES),
    active: i !== 9,
  }));

  const customers: Customer[] = Array.from({ length: 24 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
    return {
      id: `cus_${i + 1}`,
      ...stamp(-260 + i * 7),
      code: `CUST-${2001 + i}`,
      name,
      phone: `+91 9${int(100000000, 899999999)}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      pan: `${["ABCPK", "DHTPS", "MNQPR", "KLZPT"][i % 4]}${int(1000, 9999)}${["A", "B", "C", "F"][i % 4]}`,
      address: `${int(101, 1904)}, ${pick(["Silver Oak", "Rose Villa", "Sai Enclave", "Orchid Park"])}`,
      city: pick(CITIES),
      source: pick(SOURCES),
      assignedToId: pick(salesUsers).id,
      leadId: null,
    };
  });

  const leadStatuses: LeadStatus[] = [
    "NEW","NEW","CONTACTED","CONTACTED","SITE_VISIT","QUALIFIED","NEGOTIATION","CONVERTED","LOST",
  ];
  const leads: Lead[] = Array.from({ length: 58 }, (_, i) => {
    const name = `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`;
    const source = pick(SOURCES);
    return {
      id: `led_${i + 1}`,
      ...stamp(-120 + i),
      code: `LD-${3001 + i}`,
      name,
      phone: `+91 9${int(100000000, 899999999)}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      source,
      projectId: pick(projects).id,
      budget: [5000000, 7500000, 9000000, 12000000, 15000000, 18000000][int(0, 5)],
      status: pick(leadStatuses),
      assignedToId: pick(salesUsers).id,
      channelPartnerId: source === "CHANNEL_PARTNER" ? pick(channelPartners).id : null,
      nextFollowUpAt: rand() < 0.7 ? iso(int(-6, 14), int(9, 18)) : null,
      requirement: `${int(2, 3)} BHK in ${pick(CITIES)}, possession within ${int(6, 24)} months`,
      notes: "",
    };
  });
  leads.slice(0, 24).forEach((l, i) => {
    if (l.status === "CONVERTED") customers[i].leadId = l.id;
  });

  const followUps: FollowUp[] = Array.from({ length: 34 }, (_, i) => {
    const lead = pick(leads);
    return {
      id: `flw_${i + 1}`,
      ...stamp(-40 + i),
      code: `FU-${4001 + i}`,
      leadId: lead.id,
      customerId: null,
      title: pick([
        "Call to discuss pricing",
        "Share brochure and floor plans",
        "Confirm site visit slot",
        "Follow up on loan pre-approval",
        "Send revised cost sheet",
        "Discuss payment plan options",
      ]),
      dueAt: iso(int(-8, 12), int(9, 18), pick([0, 30])),
      assignedToId: lead.assignedToId,
      priority: pick(["LOW", "MEDIUM", "HIGH", "MEDIUM"] as const),
      status: rand() < 0.35 ? "COMPLETED" : "OPEN",
      notes: "",
    };
  });

  const siteVisits: SiteVisit[] = Array.from({ length: 32 }, (_, i) => {
    const lead = pick(leads);
    return {
      id: `svt_${i + 1}`,
      ...stamp(-50 + i),
      code: `SV-${5001 + i}`,
      leadId: lead.id,
      customerId: null,
      projectId: lead.projectId ?? projects[0].id,
      visitAt: iso(int(-20, 12), int(10, 18), pick([0, 30])),
      assignedToId: lead.assignedToId,
      visitors: int(1, 4),
      status: pick(["SCHEDULED", "SCHEDULED", "COMPLETED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const),
      notes: "",
    };
  });

  const planFor = (name: string, projectId: string | null, i: number): PaymentPlan => ({
    id: `pln_${i}`,
    ...stamp(-400),
    code: `PP-${100 + i}`,
    name,
    projectId,
    description: `${name} milestone schedule`,
    milestones: [
      { id: uid("ms"), name: "Booking Amount", percentage: 10, dueType: "BOOKING", dueDate: null, constructionMilestone: null },
      { id: uid("ms"), name: "Agreement", percentage: 20, dueType: "DATE", dueDate: iso(30), constructionMilestone: null },
      { id: uid("ms"), name: "Foundation", percentage: 10, dueType: "CONSTRUCTION", dueDate: null, constructionMilestone: "Foundation" },
      { id: uid("ms"), name: "Slab Casting", percentage: 15, dueType: "CONSTRUCTION", dueDate: null, constructionMilestone: "Structure" },
      { id: uid("ms"), name: "Brickwork", percentage: 15, dueType: "CONSTRUCTION", dueDate: null, constructionMilestone: "Brickwork" },
      { id: uid("ms"), name: "Possession", percentage: 30, dueType: "CONSTRUCTION", dueDate: null, constructionMilestone: "Possession" },
    ],
  });
  const paymentPlans: PaymentPlan[] = [
    planFor("Construction Linked Plan", null, 1),
    planFor("Down Payment Plan", projects[0].id, 2),
    planFor("Flexi Payment Plan", projects[1].id, 3),
  ];

  const bookings: Booking[] = [];
  const agreements: Agreement[] = [];
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const commissions: Commission[] = [];

  const soldOrBooked = units.filter((u) => u.status === "BOOKED" || u.status === "SOLD").slice(0, 22);
  soldOrBooked.forEach((unit, i) => {
    const customer = customers[i % customers.length];
    const agreementValue = Math.round(
      (unit.basePrice + unit.plc + unit.parking + unit.floorRise + unit.otherCharges) * 1.05,
    );
    const bookingDate = iso(-200 + i * 8);
    const cp = rand() < 0.4 ? pick(channelPartners) : null;
    const booking: Booking = {
      id: `bkg_${i + 1}`,
      ...stamp(-200 + i * 8),
      code: `BK-${10201 + i}`,
      customerId: customer.id,
      projectId: unit.projectId,
      towerId: unit.towerId,
      unitId: unit.id,
      bookingDate,
      bookingAmount: Math.round(agreementValue * 0.1),
      agreementValue,
      status: unit.status === "SOLD" ? "COMPLETED" : i % 7 === 0 ? "PENDING" : "CONFIRMED",
      salespersonId: pick(salesUsers).id,
      channelPartnerId: cp?.id ?? null,
      paymentPlanId: paymentPlans[i % paymentPlans.length].id,
      notes: "",
    };
    bookings.push(booking);

    agreements.push({
      id: `agr_${i + 1}`,
      ...stamp(-190 + i * 8),
      code: `AGR-${7001 + i}`,
      bookingId: booking.id,
      agreementDate: iso(-190 + i * 8),
      agreementValue,
      status: pick(["DRAFT", "GENERATED", "SENT", "SIGNED", "SIGNED"] as const),
      notes: "",
    });

    if (cp) {
      const amount = Math.round((agreementValue * cp.commissionPct) / 100);
      const status = pick(["PENDING", "ELIGIBLE", "APPROVED", "PAID"] as const);
      commissions.push({
        id: `com_${commissions.length + 1}`,
        ...stamp(-180 + i * 8),
        code: `CM-${8001 + commissions.length}`,
        bookingId: booking.id,
        channelPartnerId: cp.id,
        percentage: cp.commissionPct,
        amount,
        status,
        paidAmount: status === "PAID" ? amount : 0,
      });
    }

    const plan = paymentPlans[i % paymentPlans.length];
    let offset = -190 + i * 8;
    plan.milestones.slice(0, int(2, 5)).forEach((ms, mi) => {
      offset += int(20, 45);
      const amount = Math.round((agreementValue * ms.percentage) / 100);
      const invoice: Invoice = {
        id: `inv_${invoices.length + 1}`,
        ...stamp(offset),
        code: `INV-${90001 + invoices.length}`,
        bookingId: booking.id,
        customerId: customer.id,
        unitId: unit.id,
        demandType: ms.name,
        issueDate: iso(offset),
        dueDate: iso(offset + 15),
        amount,
        taxRate: 5,
        status: "ISSUED",
        notes: "",
      };
      invoices.push(invoice);

      const total = Math.round(amount * 1.05);
      const roll = rand();
      const paidAmount = mi === 0 || roll < 0.55 ? total : roll < 0.75 ? Math.round(total * 0.4) : 0;
      if (paidAmount > 0) {
        payments.push({
          id: `pay_${payments.length + 1}`,
          ...stamp(offset + int(2, 14)),
          code: `RCP-${60001 + payments.length}`,
          invoiceId: invoice.id,
          bookingId: booking.id,
          customerId: customer.id,
          paymentDate: iso(offset + int(2, 14)),
          amount: paidAmount,
          mode: pick(["BANK_TRANSFER", "UPI", "CHEQUE", "NEFT", "RTGS", "CARD"] as PaymentMode[]),
          reference: `REF${int(100000, 999999)}`,
          status: "SUCCESS",
          notes: "",
        });
      }
    });
  });

  // Holds on some units
  units
    .filter((u) => u.status === "HOLD")
    .slice(0, 12)
    .forEach((u, i) => {
      u.holdCustomerId = customers[i % customers.length].id;
      u.holdSalespersonId = pick(salesUsers).id;
      u.holdUntil = iso(int(0, 3), int(10, 20));
      u.holdReason = pick(["Awaiting token cheque", "Loan approval in progress", "Family confirmation pending"]);
    });

  const MILESTONE_NAMES = [
    "Land","Foundation","Plinth","Structure","Brickwork","Plaster","Electrical","Finishing","Amenities","Possession",
  ];
  const constructionMilestones: ConstructionMilestone[] = [];
  projects.forEach((project, pi) => {
    MILESTONE_NAMES.forEach((name, mi) => {
      const cutoff = pi === 3 ? 1 : pi === 2 ? 4 : 6 - pi;
      const progress = mi < cutoff ? 100 : mi === cutoff ? int(20, 80) : 0;
      const status: ConstructionMilestone["status"] =
        progress === 100 ? "COMPLETED" : progress === 0 ? "NOT_STARTED" : pi === 2 ? "DELAYED" : "IN_PROGRESS";
      constructionMilestones.push({
        id: `cms_${constructionMilestones.length + 1}`,
        ...stamp(-400 + mi * 20),
        projectId: project.id,
        name,
        sequence: mi + 1,
        startDate: iso(-420 + mi * 45),
        expectedDate: iso(-420 + (mi + 1) * 45),
        actualDate: progress === 100 ? iso(-420 + (mi + 1) * 45 + int(-10, 20)) : null,
        progress,
        status,
        notes: "",
      });
    });
  });

  const documents: DocumentRecord[] = [];
  const pushDoc = (
    name: string,
    type: DocumentRecord["type"],
    entityKind: DocumentRecord["entityKind"],
    entityId: string,
    day: number,
  ) => {
    documents.push({
      id: `doc_${documents.length + 1}`,
      ...stamp(day),
      name,
      type,
      entityKind,
      entityId,
      uploadedById: pick(users).id,
      sizeKb: int(120, 4800),
      status: pick(["PENDING", "VERIFIED", "VERIFIED"] as const),
    });
  };
  customers.slice(0, 14).forEach((c, i) => {
    pushDoc(`${c.name} - PAN Card.pdf`, "PAN", "CUSTOMER", c.id, -100 + i);
    pushDoc(`${c.name} - Aadhaar.pdf`, "AADHAAR", "CUSTOMER", c.id, -99 + i);
  });
  bookings.slice(0, 12).forEach((b, i) => {
    pushDoc(`${b.code} - Booking Form.pdf`, "BOOKING_FORM", "BOOKING", b.id, -90 + i);
    pushDoc(`${b.code} - Agreement.pdf`, "AGREEMENT", "BOOKING", b.id, -80 + i);
  });
  projects.forEach((p, i) => pushDoc(`${p.name} - RERA Certificate.pdf`, "OTHER", "PROJECT", p.id, -300 + i));

  const activities: Activity[] = [];
  const addActivity = (a: Omit<Activity, "id">) =>
    activities.push({ id: `act_${activities.length + 1}`, ...a });
  bookings.forEach((b) => {
    const cust = customers.find((c) => c.id === b.customerId)!;
    const unit = units.find((u) => u.id === b.unitId)!;
    addActivity({
      entityKind: "BOOKING",
      entityId: b.id,
      at: b.bookingDate,
      title: "Booking created",
      description: `${cust.name} booked unit ${unit.code}`,
      actorId: b.salespersonId,
    });
  });
  payments.slice(-30).forEach((p) => {
    addActivity({
      entityKind: "PAYMENT",
      entityId: p.id,
      at: p.paymentDate,
      title: "Payment received",
      description: `Payment of ₹${new Intl.NumberFormat("en-IN").format(p.amount)} received via ${p.mode}`,
      actorId: users[4].id,
    });
  });
  leads.slice(0, 30).forEach((l) => {
    addActivity({
      entityKind: "LEAD",
      entityId: l.id,
      at: l.createdAt,
      title: "Lead created",
      description: `${l.name} enquired via ${l.source}`,
      actorId: l.assignedToId,
    });
  });

  return {
    users,
    leads,
    followUps,
    siteVisits,
    customers,
    projects,
    towers,
    units,
    bookings,
    agreements,
    paymentPlans,
    invoices,
    payments,
    channelPartners,
    commissions,
    constructionMilestones,
    documents,
    activities,
  };
}
