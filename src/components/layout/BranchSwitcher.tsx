"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchCurrentBranchAction } from "@/app/actions/tenant-branches";
import { Select } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

export type SwitchableBranchOption = {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  isPrimary: boolean;
};

export function BranchSwitcher({
  currentBranchId,
  branches,
}: {
  currentBranchId: string;
  branches: SwitchableBranchOption[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  if (branches.length <= 1) {
    return null;
  }

  function handleChange(nextBranchId: string) {
    if (nextBranchId === currentBranchId) return;

    startTransition(async () => {
      const result = await switchCurrentBranchAction(nextBranchId);
      if (!result.ok) {
        window.alert(t(`branch.errors.${result.errorCode}`, t("branch.errors.accessDenied")));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-slate-500 sm:inline">{t("branch.switcher.label")}</span>
      <Select
        value={currentBranchId}
        onChange={(event) => handleChange(event.target.value)}
        className="min-w-[160px] py-1.5 text-xs"
        aria-label={t("branch.switcher.ariaLabel")}
        disabled={pending}
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name} ({branch.code})
          </option>
        ))}
      </Select>
    </div>
  );
}
