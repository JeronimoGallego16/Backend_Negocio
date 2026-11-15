import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Request } from 'express';

interface PermissionValidationResponse {
  allowed: boolean;
}

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authenticationHeaders = this.getSecurityAuthenticationHeaders(request);

    const securityBaseUrl = this.configService.get<string>('MS_SECURITY');
    if (!securityBaseUrl) {
      this.logger.error('MS_SECURITY no esta configurada');
      throw new ServiceUnavailableException('Servicio de seguridad no configurado');
    }

    try {
      const response = await axios.post<PermissionValidationResponse>(
        `${securityBaseUrl}/api/internal/security/permissions-validation`,
        {
          url: request.path,
          method: request.method,
        },
        {
          headers: authenticationHeaders,
          timeout: 5000,
        },
      );

      if (response.data.allowed === true) return true;

      throw new ForbiddenException('No tiene permiso para acceder a este recurso');
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        this.logger.warn(
          `Validacion de permisos rechazada: ${status ?? error.code ?? 'sin respuesta'}`,
        );

        if (status === 401) {
          throw new UnauthorizedException('Token invalido o expirado');
        }
        if (status === 403) {
          throw new ForbiddenException('No tiene permiso para acceder a este recurso');
        }
      }

      this.logger.error('No fue posible consultar el servicio de seguridad');
      throw new ServiceUnavailableException('Servicio de seguridad no disponible');
    }
  }

  /**
   * Builds authentication headers for the security service from the incoming request.
   *
   * @param request - Incoming request containing a bearer token or auth cookie.
   * @returns Headers that allow the security service to resolve the JWT.
   */
  private getSecurityAuthenticationHeaders(
    request: Request,
  ): { Authorization: string } | { Cookie: string } {
    const authorization = request.headers.authorization;
    if (authorization) {
      return {
        Authorization: `Bearer ${this.extractBearerToken(authorization)}`,
      };
    }

    const cookieHeader = request.headers.cookie;
    const cookieName =
      this.configService.get<string>('SECURITY_JWT_COOKIE_NAME') || 'AUTH_TOKEN';
    const authCookie = cookieHeader
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${cookieName}=`));

    if (authCookie && authCookie.slice(cookieName.length + 1).trim()) {
      return { Cookie: authCookie };
    }

    throw new UnauthorizedException('Token de autorizacion faltante');
  }

  /**
   * Extracts a JWT from a bearer authorization header.
   *
   * @param authorization - Value of the incoming Authorization header.
   * @returns The bearer JWT.
   */
  private extractBearerToken(authorization?: string): string {
    if (!authorization) {
      throw new UnauthorizedException('Token de autorizacion faltante');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token || authorization.split(' ').length !== 2) {
      throw new UnauthorizedException('Formato de Authorization invalido');
    }

    return token;
  }
}