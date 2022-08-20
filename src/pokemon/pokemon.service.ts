import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { isValidObjectId, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';


@Injectable()
export class PokemonService {


  constructor(@InjectModel(Pokemon.name)
  private readonly model: Model<Pokemon>) { }

  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {

      const pokemon = await this.model.create(createPokemonDto)

      return pokemon;

    } catch (error) {
      this.handleExceptions(error);
    }
  }

  findAll() {
    return this.model.find();
  }

  //.findById({_id:id}).exec();
  async findOne(term: string) {
    let pokemon: Pokemon;
    if (!isNaN(+term)) {
      pokemon = await this.model.findOne({ no: term })
    }

    //en mongo
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.model.findById(term);
    }
    //por nombre
    if (!pokemon) {
      pokemon = await this.model.findOne({ name: term.toLowerCase().trim() })
    }

    if (!pokemon) {
      throw new NotFoundException(`No encontrado ${term}`);
    }

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    let pokemon = await this.findOne(term);
    if (!pokemon) {
      pokemon = await this.model.findOne({ name: term.toLowerCase().trim() })
    }
    if(updatePokemonDto.name){
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }
    try {
      await pokemon.updateOne(updatePokemonDto,{new: true});

    } catch (error) {
      this.handleExceptions(error);
    }
    return {...pokemon.toJSON(), ...updatePokemonDto };
  }

  async remove(id: string) {
    //const pokemon = await this.findOne(id);
    //await pokemon.deleteOne();
   // return await this.model.findByIdAndDelete(id);
   const {deletedCount} = await this.model.deleteOne({_id: id});
   if (deletedCount === 0){
    throw new BadRequestException(`Pokemon with id ${ id } not found`)
   }
   return;
  }

  private handleExceptions(error: any){
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon exists ${JSON.stringify(error.keyValue)}`)
    }
    throw new InternalServerErrorException(`Error ${error.code}`);
  }


}
