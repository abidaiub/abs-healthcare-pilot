"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import {
  DIAGNOSTIC_PACKAGES,
  formatCurrency,
  getDefaultBillingLineItems,
  HOST_DIAGNOSTIC_TESTS,
  REFERRAL_DOCTORS,
  TENANT_TEST_SETUP,
} from "@/lib/diagnostic-data";
import { PATIENTS } from "@/lib/sample-data";

type LineItem = {
  code: string;
  name: string;
  price: number;
};

type OrderStatus = "Draft" | "Ordered" | "Sent to Sample Collection";
type PaymentStatus = "Paid" | "Partial" | "Due";

const DEFAULT_PATIENT_ID = "PT-260003";

function paymentStatus(paid: number, due: number): PaymentStatus {
  if (due <= 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Due";
}

function paymentVariant(status: PaymentStatus) {
  if (status === "Paid") return "success" as const;
  if (status === "Partial") return "warning" as const;
  return "danger" as const;
}

export function DiagnosticBillingPanel() {
  const defaultPatient = PATIENTS.find((p) => p.id === DEFAULT_PATIENT_ID);
  const [patientQuery, setPatientQuery] = useState(
    defaultPatient ? `${defaultPatient.name} (${defaultPatient.id})` : "",
  );
  const [patientId, setPatientId] = useState(DEFAULT_PATIENT_ID);
  const [referralDoctor, setReferralDoctor] = useState(REFERRAL_DOCTORS[2]);
  const [discount, setDiscount] = useState("150");
  const [paid, setPaid] = useState("1000");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [deliveryMethod, setDeliveryMethod] = useState("Print + Portal");
  const [selectedTests, setSelectedTests] = useState<LineItem[]>(
    getDefaultBillingLineItems(),
  );
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("Draft");
  const [sentToCollection, setSentToCollection] = useState(false);

  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return PATIENTS.slice(0, 6);
    return PATIENTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q),
    ).slice(0, 6);
  }, [patientQuery]);

  const selectedPatient = PATIENTS.find((p) => p.id === patientId);
  const subtotal = selectedTests.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Number(discount) || 0;
  const vatRate = 0;
  const vatAmount = Math.round((subtotal - discountAmount) * vatRate);
  const total = subtotal - discountAmount + vatAmount;
  const paidAmount = Number(paid) || 0;
  const due = Math.max(total - paidAmount, 0);
  const billingStatus = paymentStatus(paidAmount, due);

  function addTest(code: string) {
    const test = TENANT_TEST_SETUP.find((t) => t.serviceCode === code);
    if (!test || selectedTests.some((t) => t.code === code)) return;
    setSelectedTests((prev) => [
      ...prev,
      { code: test.serviceCode, name: test.serviceName, price: test.tenantPrice },
    ]);
  }

  function removeTest(code: string) {
    setSelectedTests((prev) => prev.filter((item) => item.code !== code));
  }

  function addPackage(code: string) {
    const pkg = DIAGNOSTIC_PACKAGES.find((p) => p.code === code);
    if (!pkg) return;
    const items = pkg.tests
      .map((testCode) => TENANT_TEST_SETUP.find((t) => t.serviceCode === testCode))
      .filter(Boolean)
      .map((test) => ({
        code: test!.serviceCode,
        name: test!.serviceName,
        price: test!.tenantPrice,
      }));
    setSelectedTests(items);
  }

  function handleSubmit() {
    if (!patientId || selectedTests.length === 0) return;
    setOrderNo("ORD-20260618-003");
    setInvoiceNo("INV-011");
    setOrderStatus("Ordered");
    setSentToCollection(false);
  }

  function handleSendToCollection() {
    setOrderStatus("Sent to Sample Collection");
    setSentToCollection(true);
  }

  if (orderNo && selectedPatient) {
    return (
      <Card>
        <CardBody className="space-y-5 py-10">
          <div className="text-center">
            <Badge variant="success">Order created</Badge>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Investigation order &amp; money receipt
            </h2>
          </div>

          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order details
              </p>
              <p className="mt-3">
                <span className="font-medium">Order number:</span> {orderNo}
              </p>
              <p className="mt-2">
                <span className="font-medium">Invoice no:</span> {invoiceNo}
              </p>
              <p className="mt-2">
                <span className="font-medium">Collection date:</span> 18-Jun-2026
              </p>
              <p className="mt-2">
                <span className="font-medium">Patient:</span> {selectedPatient.name}{" "}
                ({selectedPatient.id})
              </p>
              <p className="mt-2">
                <span className="font-medium">Tests:</span>{" "}
                {selectedTests.map((t) => t.code).join(", ")}
              </p>
              <p className="mt-2">
                <span className="font-medium">Payment method:</span> {paymentMethod}
              </p>
              <p className="mt-2">
                <span className="font-medium">Delivery method:</span> {deliveryMethod}
              </p>
              <p className="mt-2">
                <span className="font-medium">Total / Paid / Due:</span>{" "}
                {formatCurrency(total)} / {formatCurrency(paidAmount)} /{" "}
                {formatCurrency(due)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Workflow status
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="success">Receipt generated</Badge>
                <Badge variant="info">Ordered</Badge>
                <Badge variant={paymentVariant(billingStatus)}>{billingStatus}</Badge>
                <Badge variant={sentToCollection ? "success" : "warning"}>
                  {orderStatus}
                </Badge>
              </div>
              <p className="mt-4 text-slate-600">
                {sentToCollection
                  ? "Order is visible in Sample Collection queue with barcode-ready status."
                  : "Generate receipt first, then dispatch to phlebotomy."}
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Barcode generation placeholder
            </p>
            <div className="mx-auto mt-3 flex h-14 max-w-xs items-center justify-center bg-slate-900 font-mono text-[10px] tracking-[0.3em] text-white">
              ||| BC-260618-003 |||
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sample barcode will be generated on send to collection — UI preview only.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button">Print money receipt</Button>
            {!sentToCollection && (
              <Button type="button" onClick={handleSendToCollection}>
                Send to sample collection
              </Button>
            )}
            {sentToCollection && (
              <Link href="/lab/sample-collection">
                <Button type="button" variant="secondary">
                  Open sample collection queue
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Patient</h2>
          </div>
          <CardBody className="space-y-4">
            <div className="flex gap-3">
              <Input
                label="Search patient"
                placeholder="Search MRN / phone / name..."
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value);
                  setPatientId("");
                }}
              />
              <Link href="/patients/new" className="self-end">
                <Button type="button" variant="secondary">
                  Create patient
                </Button>
              </Link>
            </div>

            {patientQuery && !selectedPatient && (
              <ul className="rounded-xl border border-slate-200">
                {filteredPatients.map((patient) => (
                  <li key={patient.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientId(patient.id);
                        setPatientQuery(`${patient.name} (${patient.id})`);
                      }}
                      className="flex w-full justify-between px-4 py-3 text-left text-sm hover:bg-teal-50"
                    >
                      <span className="font-medium">{patient.name}</span>
                      <span className="text-slate-500">{patient.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedPatient && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Selected patient
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {selectedPatient.name}
                    </p>
                    <p className="text-sm text-slate-600">{selectedPatient.id}</p>
                  </div>
                  <Badge>{selectedPatient.gender}</Badge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Age</dt>
                    <dd className="font-medium text-slate-900">
                      {selectedPatient.age} years
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Blood group</dt>
                    <dd className="font-medium text-slate-900">
                      {selectedPatient.bloodGroup}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="font-medium text-slate-900">
                      {selectedPatient.phone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Referral</dt>
                    <dd className="font-medium text-slate-900">{referralDoctor}</dd>
                  </div>
                </dl>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Add tests / services
            </h2>
          </div>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Test / service"
                onChange={(e) => addTest(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  Select test
                </option>
                {HOST_DIAGNOSTIC_TESTS.map((test) => (
                  <option key={test.serviceCode} value={test.serviceCode}>
                    {test.serviceCode} — {test.serviceName}
                  </option>
                ))}
              </Select>
              <Select
                label="Package"
                onChange={(e) => addPackage(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  Select package
                </option>
                {DIAGNOSTIC_PACKAGES.map((pkg) => (
                  <option key={pkg.code} value={pkg.code}>
                    {pkg.name} — {formatCurrency(pkg.price)}
                  </option>
                ))}
              </Select>
            </div>

            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Code</th>
                  <th className="py-2">Service</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedTests.map((item) => (
                  <tr key={item.code} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-teal-700">{item.code}</td>
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeTest(item.code)}
                        className="text-xs font-medium text-slate-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Billing summary</h2>
        </div>
        <CardBody className="space-y-4">
          <Select
            label="Referral doctor"
            value={referralDoctor}
            onChange={(e) => setReferralDoctor(e.target.value)}
          >
            {REFERRAL_DOCTORS.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </Select>
          <Input label="Invoice no (preview)" value="INV-011" readOnly />
          <Input label="Collection date" value="18-Jun-2026" readOnly />
          <Select
            label="Payment method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option>Cash</option>
            <option>Card</option>
            <option>Mobile Banking</option>
            <option>Corporate Credit</option>
          </Select>
          <Select
            label="Delivery method"
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
          >
            <option>Print + Portal</option>
            <option>Print only</option>
            <option>Portal only</option>
            <option>WhatsApp</option>
          </Select>
          <Input
            label="Discount (BDT)"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>VAT / tax readiness</span>
              <Badge variant="info">Ready · 0%</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Tax engine placeholder for future VAT configuration per tenant.
            </p>
            <div className="mt-3 flex justify-between font-medium text-slate-900">
              <span>Computed VAT</span>
              <span>{formatCurrency(vatAmount)}</span>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Discount</span>
              <span>{formatCurrency(discountAmount)}</span>
            </div>
            <div className="mt-2 flex justify-between font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <Input
            label="Paid amount (BDT)"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
          />
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Due</span>
            <span className={due > 0 ? "text-amber-700" : "text-emerald-700"}>
              {formatCurrency(due)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={paymentVariant(billingStatus)}>{billingStatus}</Badge>
            <Badge variant="info">Ordered</Badge>
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={!patientId || selectedTests.length === 0}
            onClick={handleSubmit}
          >
            Generate order &amp; receipt
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
