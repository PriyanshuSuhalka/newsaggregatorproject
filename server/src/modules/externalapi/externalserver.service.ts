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
}
