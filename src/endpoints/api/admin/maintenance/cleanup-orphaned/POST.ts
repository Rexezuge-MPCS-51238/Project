import { AwsAccountsDAO } from '@/dao/AwsAccountsDAO';
import { RoleConfigsDAO } from '@/dao/RoleConfigsDAO';
import { TeamAccountsDAO } from '@/dao/TeamAccountsDAO';
import { IAdminActivityAPIRoute } from '@/endpoints/IAdminActivityAPIRoute';
import type { ActivityContext, IAdminEnv, IRequest, IResponse } from '@/endpoints/IAdminActivityAPIRoute';

class CleanupOrphanedDataRoute extends IAdminActivityAPIRoute<
  CleanupOrphanedDataRequest,
  CleanupOrphanedDataResponse,
  CleanupOrphanedDataEnv
> {
  schema = {
    tags: ['Admin'],
    summary: 'Cleanup Orphaned Data',
    description:
      'Deletes rows in satellite tables whose parent entity no longer exists. An AWS account is treated as active only if it appears in assumable_roles (has at least one user grant). Returns per-table deletion counts.',
    responses: {
      '200': {
        description: 'Per-table deletion counts',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                deletedCounts: {
                  type: 'object' as const,
                  properties: {
                    roleConfigs: { type: 'integer' as const },
                    teamAccounts: { type: 'integer' as const },
                    awsAccounts: { type: 'integer' as const },
                  },
                },
                totalDeleted: { type: 'integer' as const },
              },
            },
            examples: {
              'no-orphans': {
                summary: 'Nothing to clean up',
                value: {
                  deletedCounts: {
                    roleConfigs: 0,
                    teamAccounts: 0,
                    awsAccounts: 0,
                  },
                  totalDeleted: 0,
                },
              },
              'cleaned-up': {
                summary: 'Orphaned rows removed',
                value: {
                  deletedCounts: {
                    roleConfigs: 2,
                    teamAccounts: 0,
                    awsAccounts: 1,
                  },
                  totalDeleted: 3,
                },
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized - Missing or invalid authentication',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                Exception: {
                  type: 'object' as const,
                  properties: {
                    Type: { type: 'string' as const, example: 'UnauthorizedError' },
                    Message: { type: 'string' as const, example: 'No authenticated user email provided in request headers.' },
                  },
                },
              },
            },
          },
        },
      },
      '403': {
        description: 'Forbidden - User is not a superadmin',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                Exception: {
                  type: 'object' as const,
                  properties: {
                    Type: { type: 'string' as const, example: 'UnauthorizedError' },
                    Message: { type: 'string' as const, example: 'User is not a super admin.' },
                  },
                },
              },
            },
          },
        },
      },
      '500': {
        description: 'Internal server error during cleanup',
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                Exception: {
                  type: 'object' as const,
                  properties: {
                    Type: { type: 'string' as const, example: 'InternalServerError' },
                    Message: { type: 'string' as const, example: 'Failed to clean up orphaned data.' },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ CloudflareAccess: [] }],
  };

  protected async handleAdminRequest(
    _request: CleanupOrphanedDataRequest,
    env: CleanupOrphanedDataEnv,
    _cxt: ActivityContext<CleanupOrphanedDataEnv>,
  ): Promise<CleanupOrphanedDataResponse> {
    const db: D1DatabaseSession = env.AccessBridgeDB;

    const roleConfigs: number = await new RoleConfigsDAO(db).deleteOrphaned();
    const teamAccounts: number = await new TeamAccountsDAO(db).deleteOrphaned();
    const awsAccounts: number = await new AwsAccountsDAO(db).deleteOrphaned();

    const deletedCounts: DeletedCounts = {
      roleConfigs,
      teamAccounts,
      awsAccounts,
    };
    const totalDeleted: number = roleConfigs + teamAccounts + awsAccounts;

    return { deletedCounts, totalDeleted };
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CleanupOrphanedDataRequest extends IRequest {}

interface DeletedCounts {
  roleConfigs: number;
  teamAccounts: number;
  awsAccounts: number;
}

interface CleanupOrphanedDataResponse extends IResponse {
  deletedCounts: DeletedCounts;
  totalDeleted: number;
}

interface CleanupOrphanedDataEnv extends IAdminEnv {
  AccessBridgeDB: D1DatabaseSession;
}

export { CleanupOrphanedDataRoute };
