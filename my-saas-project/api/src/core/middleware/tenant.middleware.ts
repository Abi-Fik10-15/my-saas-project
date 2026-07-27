import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';


export interface TenantRequest extends Request {
    tenantId: number;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    use(req: TenantRequest, res: Response, next: NextFunction){
        const tenantHeader = req.headers['x-tenant-id'];

        if (!tenantHeader) {
            throw new BadRequestException('Missing x-tenant-id header. Data isolation requires a tenant context.');
        }

        req.tenantId = parseInt(tenantHeader as string, 10);

        if (isNaN(req.tenantId)) {
            throw new BadRequestException('Invalid tenant ID format.');
        }

        next();
    }
}