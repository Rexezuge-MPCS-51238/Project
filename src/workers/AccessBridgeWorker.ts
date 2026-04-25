import { AbstractWorker } from '@/base';
import { fromHono, HonoOpenAPIRouterType } from 'chanfana';
import { Hono } from 'hono';
import {
  AssumeRoleRoute,
  CleanupOrphanedDataRoute,
  CreateTeamRoute,
  CreateTokenRoute,
  DeleteTeamRoute,
  DeleteTokenRoute,
  DeleteRoleConfigRoute,
  FavoriteAccountRoute,
  FederateRoute,
  FederateWrapperRoute,
  GenerateConsoleUrlRoute,
  GetCurrentUserRoute,
  GrantAccessRoute,
  HideRoleRoute,
  ListAccountRolesRoute,
  ListAuditLogsRoute,
  ListAssumablesRoute,
  ListTeamAccountsRoute,
  ListTeamMembersRoute,
  ListTeamsRoute,
  RemoveAccountNicknameRoute,
  RemoveCredentialRelationshipRoute,
  RemoveTeamAccountRoute,
  RemoveTeamMemberRoute,
  RevokeAccessRoute,
  SearchAccountsRoute,
  SetAccountNicknameRoute,
  SetRoleConfigRoute,
  StoreCredentialRelationshipRoute,
  StoreCredentialRoute,
  TestCredentialChainRoute,
  AddTeamAccountRoute,
  AddTeamMemberRoute,
  UnfavoriteAccountRoute,
  UnhideRoleRoute,
  UpdateTeamMemberRoleRoute,
  UpdateTeamNameRoute,
  ValidateCredentialsRoute,
  ListTokensRoute,
} from '@/endpoints';
import { MiddlewareHandlers } from '@/middleware';
import { SPA_HTML } from '@/generated/spa-shell';

class AccessBridgeWorker extends AbstractWorker {
  protected readonly app: Hono<{ Bindings: Env }>;

  constructor() {
    super();

    const app: Hono<{ Bindings: Env }> = new Hono<{ Bindings: Env }>();

    app.use('*', MiddlewareHandlers.hmacValidation());
    app.use('/api/*', MiddlewareHandlers.activityAudit());
    app.use('/federate', MiddlewareHandlers.activityAudit());
    app.use('/api/*', MiddlewareHandlers.authentication());
    app.use('/federate', MiddlewareHandlers.authentication());

    const openapi: HonoOpenAPIRouterType<{ Bindings: Env }> = fromHono(app, {
      docs_url: '/docs',
    });

    openapi.get('/federate', FederateWrapperRoute);

    openapi.post('/api/aws/console', GenerateConsoleUrlRoute);
    openapi.post('/api/aws/assume-role', AssumeRoleRoute);
    openapi.get('/api/aws/federate', FederateRoute);

    openapi.get('/api/user/assumables', ListAssumablesRoute);
    openapi.get('/api/user/assumables/search', SearchAccountsRoute);
    openapi.get('/api/user/me', GetCurrentUserRoute);
    openapi.post('/api/user/favorites', FavoriteAccountRoute);
    openapi.delete('/api/user/favorites', UnfavoriteAccountRoute);
    openapi.post('/api/user/assumable/hidden', HideRoleRoute);
    openapi.delete('/api/user/assumable/hidden', UnhideRoleRoute);
    openapi.post('/api/user/token', CreateTokenRoute);
    openapi.delete('/api/user/token', DeleteTokenRoute);
    openapi.get('/api/user/tokens', ListTokensRoute);

    openapi.post('/api/admin/credentials', StoreCredentialRoute);
    openapi.post('/api/admin/credentials/relationship', StoreCredentialRelationshipRoute);
    openapi.delete('/api/admin/credentials/relationship', RemoveCredentialRelationshipRoute);
    openapi.post('/api/admin/access', GrantAccessRoute);
    openapi.delete('/api/admin/access', RevokeAccessRoute);
    openapi.put('/api/admin/account/nickname', SetAccountNicknameRoute);
    openapi.delete('/api/admin/account/nickname', RemoveAccountNicknameRoute);
    openapi.put('/api/admin/role/config', SetRoleConfigRoute);
    openapi.delete('/api/admin/role/config', DeleteRoleConfigRoute);
    openapi.post('/api/admin/credentials/validate', ValidateCredentialsRoute);
    openapi.post('/api/admin/credentials/test-chain', TestCredentialChainRoute);
    openapi.post('/api/admin/account/roles', ListAccountRolesRoute);
    openapi.get('/api/admin/audit-logs', ListAuditLogsRoute);

    openapi.post('/api/admin/team', CreateTeamRoute);
    openapi.delete('/api/admin/team', DeleteTeamRoute);
    openapi.get('/api/admin/teams', ListTeamsRoute);
    openapi.put('/api/admin/team/name', UpdateTeamNameRoute);
    openapi.post('/api/admin/team/member', AddTeamMemberRoute);
    openapi.delete('/api/admin/team/member', RemoveTeamMemberRoute);
    openapi.get('/api/admin/team/members', ListTeamMembersRoute);
    openapi.put('/api/admin/team/member/role', UpdateTeamMemberRoleRoute);
    openapi.post('/api/admin/team/account', AddTeamAccountRoute);
    openapi.delete('/api/admin/team/account', RemoveTeamAccountRoute);
    openapi.get('/api/admin/team/accounts', ListTeamAccountsRoute);

    openapi.post('/api/admin/maintenance/cleanup-orphaned', CleanupOrphanedDataRoute);

    app.get('*', (c) => {
      const path: string = new URL(c.req.url).pathname;
      if (path.startsWith('/api/') || path.startsWith('/openapi.') || path === '/docs' || path === '/redocs' || /\.\w+$/.test(path)) {
        return c.notFound();
      }
      return c.html(SPA_HTML);
    });

    this.app = openapi;
  }

  protected async handleFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return this.app.fetch(request, env, ctx);
  }
}

export { AccessBridgeWorker };
