/* eslint-disable @typescript-eslint/no-explicit-any */

import { GetCurrentUserRoute as OriginalGetCurrentUserRoute } from './api/user/me/GET';
import { StoreCredentialRoute as OriginalStoreCredentialRoute } from './api/admin/credentials/POST';
import { SetAccountNicknameRoute as OriginalSetAccountNicknameRoute } from './api/admin/account/nickname/PUT';
import { RemoveAccountNicknameRoute as OriginalRemoveAccountNicknameRoute } from './api/admin/account/nickname/DELETE';
import { StoreCredentialRelationshipRoute as OriginalStoreCredentialRelationshipRoute } from './api/admin/credentials/relationship/POST';
import { RemoveCredentialRelationshipRoute as OriginalRemoveCredentialRelationshipRoute } from './api/admin/credentials/relationship/DELETE';
import { ValidateCredentialsRoute as OriginalValidateCredentialsRoute } from './api/admin/credentials/validate/POST';
import { TestCredentialChainRoute as OriginalTestCredentialChainRoute } from './api/admin/credentials/test-chain/POST';

export const GetCurrentUserRoute: any = OriginalGetCurrentUserRoute;
export const StoreCredentialRoute: any = OriginalStoreCredentialRoute;
export const SetAccountNicknameRoute: any = OriginalSetAccountNicknameRoute;
export const RemoveAccountNicknameRoute: any = OriginalRemoveAccountNicknameRoute;
export const StoreCredentialRelationshipRoute: any = OriginalStoreCredentialRelationshipRoute;
export const RemoveCredentialRelationshipRoute: any = OriginalRemoveCredentialRelationshipRoute;
export const ValidateCredentialsRoute: any = OriginalValidateCredentialsRoute;
export const TestCredentialChainRoute: any = OriginalTestCredentialChainRoute;
