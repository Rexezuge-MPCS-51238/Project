import { AbstractWorker } from '@/base';
import { fromHono, HonoOpenAPIRouterType } from 'chanfana';
import { Hono } from 'hono';
import {
  GetCurrentUserRoute,
  RemoveAccountNicknameRoute,
  RemoveCredentialRelationshipRoute,
  SetAccountNicknameRoute,
  StoreCredentialRelationshipRoute,
  StoreCredentialRoute,
  TestCredentialChainRoute,
  ValidateCredentialsRoute,
} from '@/endpoints';
import { MiddlewareHandlers } from '@/middleware';

class AccessBridgeWorker extends AbstractWorker {
  protected readonly app: Hono<{ Bindings: Env }>;

  constructor() {
    super();

    const app: Hono<{ Bindings: Env }> = new Hono<{ Bindings: Env }>();

    app.use('*', MiddlewareHandlers.hmacValidation());

    const openapi: HonoOpenAPIRouterType<{ Bindings: Env }> = fromHono(app, {
      docs_url: '/docs',
    });

    openapi.get('/api/user/me', GetCurrentUserRoute);
    openapi.post('/api/admin/credentials', StoreCredentialRoute);
    openapi.post('/api/admin/credentials/relationship', StoreCredentialRelationshipRoute);
    openapi.delete('/api/admin/credentials/relationship', RemoveCredentialRelationshipRoute);
    openapi.put('/api/admin/account/nickname', SetAccountNicknameRoute);
    openapi.delete('/api/admin/account/nickname', RemoveAccountNicknameRoute);
    openapi.post('/api/admin/credentials/validate', ValidateCredentialsRoute);
    openapi.post('/api/admin/credentials/test-chain', TestCredentialChainRoute);

    this.app = openapi;
  }

  protected async handleFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return this.app.fetch(request, env, ctx);
  }
}

export { AccessBridgeWorker };
