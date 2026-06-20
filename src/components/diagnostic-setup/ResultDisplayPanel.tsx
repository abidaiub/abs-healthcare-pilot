"use client";

import { VisualPlaceholderBanner } from "@/components/diagnostic-setup/VisualPlaceholderBanner";
import { Card, CardBody, Input, Select } from "@/components/ui";
import {
  RESULT_DISPLAY_PREVIEW,
  RESULT_DISPLAY_RULES,
} from "@/lib/diagnostic-master-data";

export function ResultDisplayPanel() {
  const ruleMap = Object.fromEntries(RESULT_DISPLAY_RULES.map((r) => [r.id, r]));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <VisualPlaceholderBanner label="Result display rules use mock data until a schema model is added" />
      </div>
      <Card>
        <CardBody className="space-y-4">
          {RESULT_DISPLAY_RULES.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{rule.label}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input label="Text color" defaultValue={rule.textColor} />
                <Input label="Background color" defaultValue={rule.backgroundColor} />
                <Select label="Bold" defaultValue={rule.bold ? "Yes" : "No"}>
                  <option>Yes</option>
                  <option>No</option>
                </Select>
                <Select label="Underline" defaultValue={rule.underline ? "Yes" : "No"}>
                  <option>Yes</option>
                  <option>No</option>
                </Select>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-4 text-sm font-semibold text-slate-900">Preview</p>
          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            {RESULT_DISPLAY_PREVIEW.map((item) => {
              const rule = ruleMap[item.flag];
              return (
                <div
                  key={item.test}
                  className="rounded-lg px-4 py-3"
                  style={{
                    color: rule.textColor,
                    backgroundColor: rule.backgroundColor,
                    fontWeight: rule.bold ? "bold" : "normal",
                    textDecoration: rule.underline ? "underline" : "none",
                  }}
                >
                  <span className="font-medium">{item.test}</span>
                  <span className="ml-4">{item.value}</span>
                  <span className="ml-2 text-xs opacity-70">({rule.label})</span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
