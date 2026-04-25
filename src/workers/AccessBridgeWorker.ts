import { AbstractWorker } from '@/base';
import { fromHono, HonoOpenAPIRouterType } from 'chanfana';
import { Hono } from 'hono';
import {
  AssumeRoleRoute,
  DeleteRoleConfigRoute,
  FavoriteAccountRoute,
  FederateRoute,
  FederateWrapperRoute,
  GenerateConsoleUrlRoute,
  GetCurrentUserRoute,
  GrantAccessRoute,
  HideRoleRoute,
  ListAccountRolesRoute,
  ListAssumablesRoute,
  RemoveAccountNicknameRoute,
  RemoveCredentialRelationshipRoute,
  RevokeAccessRoute,
  SearchAccountsRoute,
  SetAccountNicknameRoute,
  SetRoleConfigRoute,
  StoreCredentialRelationshipRoute,
  StoreCredentialRoute,
  TestCredentialChainRoute,
  UnfavoriteAccountRoute,
  UnhideRoleRoute,
  ValidateCredentialsRoute,
} from '@/endpoints';
import { MiddlewareHandlers } from '@/middleware';
import { SPA_HTML } from '@/generated/spa-shell';

class AccessBridgeWorker extends AbstractWorker {
  protected readonly app: Hono<{ Bindings: Env }>;

  constructor() {
    super();

    const app: Hono<{ Bindings: Env }> = new Hono<{ Bindings: Env }>();

    app.use('*', MiddlewareHandlers.hmacValidation());

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
