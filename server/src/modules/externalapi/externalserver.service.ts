import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExternalAPI } from "./external-api.entity";
import { UpdateExternalApiDto } from "./dto/update-external-api.dto";

@Injectable()
export class ExternalServerService {
  constructor(
    @InjectRepository(ExternalAPI)
    private externalApiRepo: Repository<ExternalAPI>
  ) {}

  async findAll() {
    const servers = await this.externalApiRepo.find();

    return servers.map((s, i) => ({
      id: s.externalAPIID,
      name: s.name,
      key: s.key || '<not set>',
      status: s.APIStatus === 1 ? "Active" : "Not Active",
      lastAccessed: s.lastAccessed.toDateString(),
      display: `${i + 1}. ${s.name} - ${
        s.APIStatus === 1 ? "Active" : "Not Active"
      } - last accessed: ${s.lastAccessed.toDateString()}`,
    }));
  }

  async findOne(id: number) {
    return this.externalApiRepo.findOneBy({ externalAPIID: id });
  }

  async updateApiKey(id: number, key: string) {
    await this.externalApiRepo.update(id, { key });
    return this.findOne(id);
  }

  async update(id: number, updateExternalApiDto: UpdateExternalApiDto) {
    await this.externalApiRepo.update(id, updateExternalApiDto);
    return this.findOne(id);
  }

  async updateStatus(id: number, status: number) {
    await this.externalApiRepo.update(id, { APIStatus: status });
    return this.findOne(id);
  }

  async updateLastAccessed(id: number) {
    await this.externalApiRepo.update(id, { lastAccessed: new Date() });
    return this.findOne(id);
  }
}
