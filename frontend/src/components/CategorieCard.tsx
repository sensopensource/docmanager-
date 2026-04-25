import { useState, type ChangeEvent } from "react";
import type { Categorie } from "../types";



type Props = {
    categorie: Categorie
    onUpdate: (updated: Categorie) => void
}

function CategorieCard({categorie,onUpdate}: Props) {
    const [editMode,setEditMode] = useState(false)
    const [nomEdit,setNomEdit] = useState(categorie.nom)

    const handleCancel = () => {
        setNomEdit(categorie.nom)
        setEditMode(false)
    }

    const handleValidate = () => {
    onUpdate({ ...categorie, nom: nomEdit })   // déclenche la mutation du hook
    setEditMode(false)
   }





    return (
    <li>
     { editMode ? (
        <>
            <span>
                <input type="text"
                       value={nomEdit}
                       onChange={(e: ChangeEvent<HTMLInputElement>) => setNomEdit(e.target.value)}/>
            </span>
            <button onClick={handleValidate}>Valider</button>
            <button onClick={handleCancel}>Annuler</button>
        </>
     ): (
        <>
        <span>
           {categorie.nom}
        </span>
        <button onClick={() => setEditMode(true)}>
            Modifier
        </button>
        </>

     )} </li>  ) }


export default CategorieCard
