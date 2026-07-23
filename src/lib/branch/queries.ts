import type { BranchType, EntityStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type BranchListFilters = {
  search?: string;
  status?: "all" | "active" | "inactive";
  branchType?: BranchType | "all";
  page?: number;
  pageSize?: number;
};

export type BranchListRow = {
  id: string;
  code: string;
  name: string;
  branchType: BranchType;
  city: string | null;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  isActive: boolean;
  status: EntityStatus;
  assignedUserCount: number;
};

function branchWhere(
  tenantId: string,
  filters: BranchListFilters,
): Prisma.BranchWhereInput {
  const where: Prisma.BranchWhereInput = { tenantId };

  if (filters.status === "active") {
    where.isActive = true;
  } else if (filters.status === "inactive") {
    where.isActive = false;
  }

  if (filters.branchType && filters.branchType !== "all") {
    where.branchType = filters.branchType;
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listTenantBranches(
  tenantId: string,
  filters: BranchListFilters = {},
): Promise<{ rows: BranchListRow[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const where = branchWhere(tenantId, filters);

  const [total, branches] = await Promise.all([
    prisma.branch.count({ where }),
    prisma.branch.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { userBranches: { where: { isActive: true } } } },
      },
    }),
  ]);

  return {
    rows: branches.map((branch) => ({
      id: branch.id,
      code: branch.code,
      name: branch.name,
      branchType: branch.branchType,
      city: branch.city,
      phone: branch.phone,
      email: branch.email,
      isDefault: branch.isDefault,
      isActive: branch.isActive,
      status: branch.status,
      assignedUserCount: branch._count.userBranches,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getTenantBranchDetail(tenantId: string, branchId: string) {
  return prisma.branch.findFirst({
    where: { id: branchId, tenantId },
    include: {
      _count: { select: { userBranches: { where: { isActive: true } } } },
      userBranches: {
        where: { isActive: true },
        orderBy: [{ isPrimary: "desc" }, { user: { username: "asc" } }],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              isActive: true,
              userStatus: true,
            },
          },
        },
      },
    },
  });
}

export async function assertTenantOwnsBranchRecord(tenantId: string, branchId: string) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId },
  });
  if (!branch) {
    throw new Error("BRANCH_NOT_FOUND");
  }
  return branch;
}

export async function listEligibleUsersForBranchAssignment(tenantId: string) {
  return prisma.user.findMany({
    where: {
      tenantId,
      isActive: true,
      userStatus: "ACTIVE",
      isHostAdmin: false,
    },
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      userBranches: {
        where: { tenantId, isActive: true },
        select: { branchId: true, isPrimary: true },
      },
    },
  });
}

export async function getTenantDefaultBranch(tenantId: string) {
  return prisma.branch.findFirst({
    where: { tenantId, isDefault: true, isActive: true },
  });
}

export async function countActiveBranches(tenantId: string) {
  return prisma.branch.count({ where: { tenantId, isActive: true } });
}
