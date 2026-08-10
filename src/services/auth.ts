import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Usuario, TipoUsuario } from '../types';

export const ADMIN_EMAILS = [
  'eliavelozo6@gmail.com',
  'admin@menupro.com'
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

async function validarUsuarioERestaurante(usuario: Usuario | null, uid: string, emailOriginal?: string): Promise<Usuario> {
  const isAdm = isAdminEmail(usuario?.email || emailOriginal);

  // Se é email do admin SaaS, garante perfil de admin
  if (isAdm) {
    if (!usuario) {
      const adminUser: Usuario = {
        id: uid,
        nome: 'Administrador SaaS',
        email: emailOriginal || 'eliavelozo6@gmail.com',
        tipo: 'admin',
        criadoEm: new Date().toISOString()
      };
      await setDoc(doc(db, 'usuarios', uid), adminUser);
      return adminUser;
    }
    if (usuario.tipo !== 'admin') {
      usuario.tipo = 'admin';
      await setDoc(doc(db, 'usuarios', uid), { tipo: 'admin' }, { merge: true });
    }
    return usuario;
  }

  // Se não é admin, precisa ter um registro de usuário válido
  if (!usuario) {
    await signOut(auth);
    throw new Error('Esta conta de restaurante foi removida pelo administrador ou não existe mais.');
  }

  if (!usuario.restauranteId) {
    await deleteDoc(doc(db, 'usuarios', uid)).catch(() => {});
    await signOut(auth);
    throw new Error('Não há nenhum restaurante associado a este login.');
  }

  // Verificar se o restaurante realmente existe no Firestore
  const restDocSnap = await getDoc(doc(db, 'restaurantes', usuario.restauranteId));
  if (!restDocSnap.exists()) {
    // O restaurante foi excluído pelo SaaS Admin!
    await deleteDoc(doc(db, 'usuarios', uid)).catch(() => {});
    await signOut(auth);
    throw new Error('Este restaurante foi excluído pelo administrador do SaaS.');
  }

  return usuario;
}

export async function cadastrarUsuario(
  nome: string,
  email: string,
  senha: string,
  tipo: TipoUsuario = 'restaurante',
  restauranteId?: string
): Promise<Usuario> {
  let uid: string;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    uid = userCredential.user.uid;
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      try {
        const loginCred = await signInWithEmailAndPassword(auth, email, senha);
        uid = loginCred.user.uid;
      } catch (loginErr) {
        throw new Error('Este e-mail já está em uso por outro restaurante. Por favor, faça login ou utilize outro e-mail.');
      }
    } else {
      throw err;
    }
  }

  const finalTipo: TipoUsuario = isAdminEmail(email) ? 'admin' : tipo;

  const novoUsuario: Usuario = {
    id: uid,
    nome,
    email,
    tipo: finalTipo,
    restauranteId: restauranteId || '',
    criadoEm: new Date().toISOString()
  };

  await setDoc(doc(db, 'usuarios', uid), novoUsuario);
  return novoUsuario;
}

export async function loginUsuario(email: string, senha: string): Promise<Usuario> {
  const userCredential = await signInWithEmailAndPassword(auth, email, senha);
  const uid = userCredential.user.uid;
  const usuario = await buscarDadosUsuario(uid);
  return await validarUsuarioERestaurante(usuario, uid, userCredential.user.email || email);
}

export async function loginComGoogle(): Promise<Usuario> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const uid = user.uid;

  const usuario = await buscarDadosUsuario(uid);
  return await validarUsuarioERestaurante(usuario, uid, user.email || undefined);
}

export async function logoutUsuario(): Promise<void> {
  await signOut(auth);
}

export async function buscarDadosUsuario(uid: string): Promise<Usuario | null> {
  try {
    const userDocRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as Usuario;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return null;
  }
}

export function escutarAuth(callback: (usuario: Usuario | null, firebaseUser: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      let dados = await buscarDadosUsuario(user.uid);

      // Se o documento de usuário ainda não estiver no Firestore, dá um tempo curto (ex: criação de conta)
      if (!dados) {
        await new Promise(resolve => setTimeout(resolve, 600));
        dados = await buscarDadosUsuario(user.uid);
      }

      const isAdm = isAdminEmail(user.email);

      if (isAdm) {
        if (!dados) {
          dados = {
            id: user.uid,
            nome: user.displayName || 'Administrador SaaS',
            email: user.email || 'eliavelozo6@gmail.com',
            tipo: 'admin',
            criadoEm: new Date().toISOString()
          };
          await setDoc(doc(db, 'usuarios', user.uid), dados);
        } else if (dados.tipo !== 'admin') {
          dados = { ...dados, tipo: 'admin' };
          await setDoc(doc(db, 'usuarios', user.uid), { tipo: 'admin' }, { merge: true });
        }
        callback(dados, user);
        return;
      }

      // Se ainda não tiver dados no Firestore, passa o firebaseUser
      if (!dados) {
        callback(null, user);
        return;
      }

      // Se não tem restauranteId associado
      if (!dados.restauranteId) {
        callback(dados, user);
        return;
      }

      // Checar se o restaurante ainda existe no Firestore
      const restDocSnap = await getDoc(doc(db, 'restaurantes', dados.restauranteId));
      if (!restDocSnap.exists()) {
        // O restaurante foi excluído pelo SaaS Admin!
        await deleteDoc(doc(db, 'usuarios', user.uid)).catch(() => {});
        await signOut(auth);
        callback(null, null);
        return;
      }

      callback(dados, user);
    } else {
      callback(null, null);
    }
  });
}

export async function redefinirSenha(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/login`
  });
}


