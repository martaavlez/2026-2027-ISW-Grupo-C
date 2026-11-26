// La lista de favoritos ahora es la carpeta Favoritos del perfil (HU-06).
import { Redirect } from 'expo-router';

export default function FavoritesScreen() {
  return <Redirect href={{ pathname: '/perfil', params: { carpeta: 'favoritos' } }} />;
}
