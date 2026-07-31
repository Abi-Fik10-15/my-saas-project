import { ApiProperty } from '@nestjs/swagger';

export class RegisterTenantDto {
    @ApiProperty({ example: 'Acme Corporation', description: 'Name of the new organization' })
    organizationName!: string;

    @ApiProperty({ example: 'acme-corp', description: 'Unique URL slug for the organization'})
    organizationSlug!: string;

    @ApiProperty({ example: 'admin@acmecorp.com', description: 'Admin user email' })
    email!: string;

    @ApiProperty({ example: 'SuperSecret123!', description: 'Admin user password' })
    password!: string;

    @ApiProperty({ example: 'Jane Doe', description: 'Full name of the account creator'})
    name!: string;
}