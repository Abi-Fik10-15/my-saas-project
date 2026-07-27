import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { TenantRequest } from '../middleware/tenant.middleware';

export const GetTenantId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): number => {
        const request = ctx.switchToHttp().getRequest<TenantRequest>();
        return request.tenantId;
    } 
);