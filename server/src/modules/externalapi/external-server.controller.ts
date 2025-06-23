import { Controller, Get, Param, Put, Body } from "@nestjs/common";
import { ExternalServerService } from "./externalserver.service";
import { UpdateExternalApiDto } from "./dto/update-external-api.dto";
import { ExternalAPI } from "./external-api.entity";
import { plainToInstance } from "class-transformer";

@Controller("external-servers")
export class ExternalServerController {
  constructor(private readonly externalServerService: ExternalServerService) {}

  @Get()
  async getAllServers() {
    const servers = await this.externalServerService.findAll();
    return plainToInstance(ExternalAPI, servers, { exposeUnsetFields: false });
  }

  @Get(":id")
  getServerById(@Param("id") id: number) {
    return this.externalServerService.findOne(id);
  }

  @Put(":id")
  updateApiKey(@Param("id") id: number, @Body("key") key: string) {
    return this.externalServerService.updateApiKey(id, key);
  }
}
