from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Equipment = Literal["caja-china", "cilindro", "parrilla", "horno-barro", "cocina-convencional", "airfryer"]
Protein = Literal["res", "cerdo", "pollo", "cordero", "pescado"]


class Recipe(BaseModel):
    model_config = ConfigDict(extra="forbid")

    titulo: str = Field(min_length=1, max_length=2000)
    equipo: Equipment
    carne: Protein
    tiempoPrep: str = Field(min_length=1, max_length=2000)
    tiempoCoccion: str = Field(min_length=1, max_length=2000)
    porciones: int = Field(ge=1, le=1000)
    imagen: str = Field(default="", max_length=2000)
    descripcion: str = Field(min_length=1, max_length=2000)
    ingredientes: list[str] = Field(min_length=1, max_length=300)
    pasos: list[str] = Field(min_length=1, max_length=300)
    maridajeSalsas: list[str] = Field(default_factory=list, max_length=100)
    maridajeEnsaladas: list[str] = Field(default_factory=list, max_length=100)
    maridajeBebidas: list[str] = Field(default_factory=list, max_length=100)


class ImportedRecipe(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recipeKey: str = Field(min_length=1, max_length=200)
    recipe: Recipe


class CatalogItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: str = Field(min_length=1, max_length=500)
    tipo: Literal["salsa", "acompanamiento", "ensalada", "coctel", "vino", "cerveza", "sin-alcohol"]
    tiempoPrep: str = Field(min_length=1, max_length=2000)
    porciones: int = Field(ge=1, le=1000)
    imagen: str = Field(default="", max_length=2000)
    descripcion: str = Field(min_length=1, max_length=2000)
    ingredientes: list[str] = Field(default_factory=list, max_length=300)
    pasos: list[str] = Field(default_factory=list, max_length=300)


class ImportedItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    itemKey: str = Field(min_length=1, max_length=200)
    item: CatalogItem


class IngestPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    driveFileId: str = Field(min_length=1, max_length=500)
    contentHash: str = Field(pattern=r"^[a-fA-F0-9]{64}$")
    fileName: str = Field(min_length=1, max_length=500)
    mimeType: str = Field(default="", max_length=200)
    recipes: list[ImportedRecipe] = Field(default_factory=list, max_length=100)
    recipeKey: str | None = Field(default=None, max_length=200)
    recipe: Recipe | None = None
    contentType: Literal["receta", "catalogo", "bar"] = "receta"
    items: list[ImportedItem] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def normalize_single_recipe(self):
        if not self.recipes and self.recipe is not None:
            self.recipes = [ImportedRecipe(recipeKey=self.recipeKey or "1", recipe=self.recipe)]
        if not self.recipes:
            if self.items:
                return self
            raise ValueError("Provide at least one recipe or catalog item")
        return self


class UploadPayload(BaseModel):
    fileName: str = Field(min_length=1, max_length=500)
    mimeType: str = Field(default="application/octet-stream", max_length=200)
    contentBase64: str = Field(min_length=1)
    contentType: Literal["receta", "catalogo", "bar"]
