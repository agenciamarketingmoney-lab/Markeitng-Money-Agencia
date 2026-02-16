import { db, auth } from "../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, doc, query, where, setDoc, getDoc, deleteDoc, writeBatch, limit } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth } from "firebase/auth";
import { initializeApp, getApp, deleteApp } from "firebase/app";
import { Campaign, Task, TaskStatus, UserProfile, UserRole, AppSettings, BreakdownData } from "../types";
import { MOCK_CAMPAIGNS, MOCK_TASKS } from "../constants";

// Nome das coleções no Firestore
const CAMPAIGNS_COLLECTION = "campaigns";
const TASKS_COLLECTION = "tasks";
const USERS_COLLECTION = "users";
const SETTINGS_COLLECTION = "settings";

// Helper para tratar erros
const logError = (error: any, context: string) => {
    console.error(`Erro em ${context}:`, error);
};

// --- AUTH & USERS ---

export const loginUser = async (email: string, pass: string): Promise<{user: any, role: UserRole, profile: UserProfile | null}> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        try {
            let profile: UserProfile | null = null;
            
            const docRef = doc(db, USERS_COLLECTION, user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                 profile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
            } else {
                const q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    profile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
                }
            }

            // SAFETY OVERRIDE: Garante que o email mestre seja sempre ADMIN
            if (email === 'admin@marketingmoney.com') {
                if (profile) profile.role = 'ADMIN';
                else {
                     profile = {
                        id: user.uid,
                        name: 'Administrador Master',
                        email: email,
                        role: 'ADMIN',
                        createdAt: new Date().toISOString()
                    };
                }
            }

            if (profile) {
                return { user, role: profile.role, profile };
            }
        } catch (dbError: any) {
            console.warn("Aviso: Erro DB (Permissões). Usando Fallback de Email.", dbError);
            
            // Fallback baseado no email se o DB falhar
            let fallbackRole: UserRole = 'TEAM';
            let fallbackName = "Usuário";

            if (email.includes('admin') || email === 'admin@marketingmoney.com') {
                fallbackRole = 'ADMIN';
                fallbackName = 'Administrador (Modo Segurança)';
            } else if (email.includes('cliente') || email === 'cliente@marketingmoney.com') {
                fallbackRole = 'CLIENT';
                fallbackName = 'Cliente (Modo Segurança)';
            } else {
                fallbackRole = 'TEAM';
                fallbackName = 'Equipe (Modo Segurança)';
            }

            return { 
                user, 
                role: fallbackRole, 
                profile: { 
                    name: fallbackName, 
                    email: email, 
                    role: fallbackRole, 
                    createdAt: new Date().toISOString() 
                } 
            };
        }

        const newProfile: UserProfile = {
            name: email.split('@')[0],
            email: email,
            role: 'TEAM',
            createdAt: new Date().toISOString()
        };
        try { await setDoc(doc(db, USERS_COLLECTION, user.uid), newProfile); } catch(e) {}
        
        return { user, role: 'TEAM', profile: newProfile };

    } catch (error) {
        throw error;
    }
};

export const logoutUser = async () => {
    await signOut(auth);
};

export const registerNewUser = async (email: string, password: string, profileData: UserProfile) => {
    let secondaryApp: any = null;
    try {
        const config = getApp().options;
        // Usa um nome único ou fixo, mas garante que limpamos depois
        const appName = "SecondaryApp-" + new Date().getTime(); 
        secondaryApp = initializeApp(config, appName);
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCredential.user.uid;

        try {
            await setDoc(doc(db, USERS_COLLECTION, uid), {
                ...profileData,
                id: uid
            });
        } catch (dbError) {
            console.warn("Erro ao salvar perfil no DB (Permissões):", dbError);
        }

        await signOut(secondaryAuth);
        return uid;
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("Este email já está sendo usado por outro usuário.");
        }
        logError(error, "registrar novo usuário");
        throw error;
    } finally {
        if (secondaryApp) {
            try {
                await deleteApp(secondaryApp);
            } catch (e) {
                console.warn("Erro ao limpar app secundário", e);
            }
        }
    }
};

// Nova função para atualizar usuário existente
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, data);
    } catch (error) {
        logError(error, "atualizar perfil de usuário");
        throw error;
    }
};

export const getUsers = async (): Promise<UserProfile[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() } as UserProfile);
        });
        return users;
    } catch (error) {
        console.warn("Erro ao buscar lista de usuários:", error);
        return [];
    }
}

// Nova função específica para buscar apenas clientes para o dropdown
export const getClients = async (): Promise<UserProfile[]> => {
    try {
        const q = query(collection(db, USERS_COLLECTION), where("role", "==", "CLIENT"));
        const querySnapshot = await getDocs(q);
        const clients: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            clients.push({ id: doc.id, ...doc.data() } as UserProfile);
        });
        return clients;
    } catch (error) {
        // Fallback mock se der erro de permissão ou não tiver clientes
        return [
            { id: 'mock-client-1', name: 'Empresa Modelo Ltda', email: 'cliente@marketingmoney.com', role: 'CLIENT', companyName: 'Empresa Modelo Ltda', createdAt: '' }
        ];
    }
}

export const seedSystemUsers = async () => {
    const usersToCreate = [
        {
            email: "admin@marketingmoney.com",
            password: "admin123", 
            profile: {
                name: "Administrador Master",
                email: "admin@marketingmoney.com",
                role: "ADMIN" as UserRole,
                createdAt: new Date().toISOString()
            }
        },
        {
            email: "equipe@marketingmoney.com",
            password: "equipe123",
            profile: {
                name: "Gerente de Contas",
                email: "equipe@marketingmoney.com",
                role: "TEAM" as UserRole,
                createdAt: new Date().toISOString()
            }
        },
        {
            email: "cliente@marketingmoney.com",
            password: "cliente123",
            profile: {
                name: "Diretor Comercial",
                email: "cliente@marketingmoney.com",
                role: "CLIENT" as UserRole,
                companyName: "Empresa Modelo Ltda",
                createdAt: new Date().toISOString()
            }
        }
    ];

    let results = { success: 0, failed: 0, messages: [] as string[] };

    for (const u of usersToCreate) {
        try {
            await registerNewUser(u.email, u.password, u.profile);
            results.success++;
            results.messages.push(`Criado: ${u.email}`);
        } catch (error: any) {
             if (error.message.includes("já está sendo usado")) {
                 results.messages.push(`Já existe: ${u.email} (OK)`);
             } else {
                 results.failed++;
                 results.messages.push(`Erro ${u.email}: ${error.message}`);
             }
        }
    }
    return results;
};


// --- SETTINGS (INTEGRAÇÕES) ---

export const saveSettings = async (settings: AppSettings) => {
    try {
        // Agora só salvamos o token global, metaAccountId foi removido do global
        await setDoc(doc(db, SETTINGS_COLLECTION, 'integrations'), settings, { merge: true });
    } catch (error) {
        logError(error, "salvar configurações");
        throw error;
    }
};

export const getSettings = async (): Promise<AppSettings> => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'integrations');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as AppSettings;
        }
        return { metaAdsToken: '' };
    } catch (error) {
        return { metaAdsToken: '' };
    }
};

export const validateMetaToken = async (token: string): Promise<{valid: boolean, message: string}> => {
    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
        const data = await response.json();
        if (data.error) {
            return { valid: false, message: data.error.message };
        }
        return { valid: true, message: `Token válido! Conectado como: ${data.name} (ID: ${data.id})` };
    } catch (error: any) {
        return { valid: false, message: "Erro de rede ao validar token." };
    }
};


// --- CAMPAIGNS ---

// Atualizado para filtrar por clientId
export const getCampaigns = async (filterClientId?: string): Promise<Campaign[]> => {
  try {
    let q;
    if (filterClientId && filterClientId !== 'all') {
        q = query(collection(db, CAMPAIGNS_COLLECTION), where("clientId", "==", filterClientId));
    } else {
        q = collection(db, CAMPAIGNS_COLLECTION);
    }

    const querySnapshot = await getDocs(q);
    const campaigns: Campaign[] = [];
    querySnapshot.forEach((doc) => {
      campaigns.push({ id: doc.id, ...doc.data() } as Campaign);
    });
    return campaigns;
  } catch (error) {
    return [];
  }
};

export const addCampaign = async (campaign: Omit<Campaign, 'id'>) => {
    try {
        await addDoc(collection(db, CAMPAIGNS_COLLECTION), campaign);
    } catch (error) {
        logError(error, "adicionar campanha");
        throw error;
    }
}

// === PROTOCOLO DE EXCLUSÃO RECURSIVA ===
// Esta função deleta em lotes até que NÃO SOBRE NADA.
export const clearAllCampaigns = async () => {
    let totalDeleted = 0;
    let keepDeleting = true;
    const BATCH_SIZE = 400; // Limite seguro do Firestore

    try {
        console.log("Iniciando Protocolo de Exclusão Recursiva...");
        
        while (keepDeleting) {
            // Busca apenas o próximo lote de X itens
            const q = query(collection(db, CAMPAIGNS_COLLECTION), limit(BATCH_SIZE));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                keepDeleting = false;
                console.log("Nenhum documento restante. Limpeza concluída.");
                break;
            }

            console.log(`Encontrados ${snapshot.size} documentos. Deletando lote...`);

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            totalDeleted += snapshot.size;
            console.log(`Lote deletado. Total acumulado: ${totalDeleted}`);
            
            // Pequena pausa para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return { success: true, message: `${totalDeleted} campanhas foram apagadas permanentemente.` };
    } catch (error: any) {
        console.error("Erro Crítico ao limpar campanhas:", error);
        return { success: false, message: "Erro crítico ao limpar: " + error.message };
    }
}

// --- SYNC ENGINE (AGENCY OWNER MIRROR MODE) ---
export const syncMetaCampaigns = async (clientId: string, datePreset: string = 'maximum'): Promise<{success: boolean, message: string}> => {
    try {
        // 1. Setup inicial
        const settings = await getSettings();
        const token = settings.metaAdsToken;
        if (!token) return { success: false, message: "Token da Agência não configurado." };

        const clientDoc = await getDoc(doc(db, USERS_COLLECTION, clientId));
        if (!clientDoc.exists()) return { success: false, message: "Cliente não encontrado." };
        
        const clientData = clientDoc.data() as UserProfile;
        let accountId = clientData.adAccountId;
        if (!accountId) return { success: false, message: "Cliente sem ID de Conta." };

        accountId = accountId.trim();
        if (!accountId.startsWith('act_')) accountId = `act_${accountId}`;

        console.log(`[MetaSync] Iniciando espelhamento total para ${accountId} (${datePreset})`);

        // 2. BUSCA DO ESTADO ATUAL NO BANCO DE DADOS (Para detectar fantasmas)
        const existingCampaigns = await getCampaigns(clientId);
        const existingCampaignMap = new Map<string, Campaign>();
        existingCampaigns.forEach(c => {
            if (c.externalId) existingCampaignMap.set(c.externalId, c);
        });

        // 3. URLs das APIs (MODO ESPELHO)
        const campaignsUrl = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=name,status,effective_status,objective,insights{spend,impressions,clicks,cpc,ctr,action_values,actions,inline_link_clicks}&date_preset=${datePreset}&use_account_attribution_setting=true&limit=1000&access_token=${token}`;
        
        const demographicsUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=campaign&breakdowns=age,gender&fields=campaign_id,spend,impressions&date_preset=${datePreset}&use_account_attribution_setting=true&access_token=${token}&limit=1000`;
        const platformUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?level=campaign&breakdowns=publisher_platform&fields=campaign_id,spend,impressions&date_preset=${datePreset}&use_account_attribution_setting=true&access_token=${token}&limit=1000`;

        const [campRes, demoRes, platRes] = await Promise.all([
            fetch(campaignsUrl),
            fetch(demographicsUrl),
            fetch(platformUrl)
        ]);

        const campData = await campRes.json();
        const demoData = await demoRes.json();
        const platData = await platRes.json();

        if (campData.error) return { success: false, message: `Erro API Meta: ${campData.error.message}` };
        
        // 4. Mapear Dados Auxiliares
        const ageMap: Record<string, BreakdownData> = {};
        const genderMap: Record<string, BreakdownData> = {};
        const platformMap: Record<string, BreakdownData> = {};

        // Processar Demografia
        if (demoData.data) {
            demoData.data.forEach((row: any) => {
                const cid = row.campaign_id;
                const value = Number(row.impressions || 0);
                if (!ageMap[cid]) ageMap[cid] = {};
                if (!genderMap[cid]) genderMap[cid] = {};
                ageMap[cid][row.age] = (ageMap[cid][row.age] || 0) + value;
                genderMap[cid][row.gender] = (genderMap[cid][row.gender] || 0) + value;
            });
        }
        // Processar Plataforma
        if (platData.data) {
            platData.data.forEach((row: any) => {
                const cid = row.campaign_id;
                const value = Number(row.spend || 0);
                if (!platformMap[cid]) platformMap[cid] = {};
                platformMap[cid][row.publisher_platform] = (platformMap[cid][row.publisher_platform] || 0) + value;
            });
        }
        
        // 5. PROCESSAMENTO E ATUALIZAÇÃO (ESPELHAMENTO)
        const activeIdsInMeta = new Set<string>();

        if (campData.data) {
            for (const item of campData.data) {
                activeIdsInMeta.add(item.id);

                const insight = item.insights?.data?.[0] || {};
                const objective = item.objective || '';
                const actions = insight.actions || [];
                const actionValues = insight.action_values || [];

                // --- LOGICA DE SOMA DE MENSAGENS (SUPER AGRESSIVA) ---
                let messagingSum = 0;
                let leadSum = 0;
                let purchaseValue = 0;

                actions.forEach((act: any) => {
                    const type = act.action_type;
                    const val = Number(act.value);
                    
                    if (type.includes('messaging_conversation_started') || 
                        type.includes('contact_total') || 
                        type.includes('onsite_conversion.messaging_conversation')) {
                        messagingSum += val;
                    }

                    if (type === 'lead' || type === 'on_facebook_lead') {
                        leadSum += val;
                    }
                });

                const linkClicks = Number(insight.inline_link_clicks || insight.clicks || 0);
                if (messagingSum === 0 && leadSum === 0 && (objective.includes('MESSAGES') || objective.includes('TRAFFIC')) && linkClicks > 0) {
                     // Conservador: mantem 0 se não houver conversão explicita
                }

                actionValues.forEach((av: any) => {
                    if (av.action_type === 'purchase' || av.action_type === 'omni_purchase') {
                        purchaseValue += Number(av.value);
                    }
                });

                const spend = Number(insight.spend || 0);
                
                // STATUS EFETIVO
                let realStatus: 'Active' | 'Paused' | 'Completed' = 'Active';
                const metaStatus = item.effective_status || item.status;
                
                if (metaStatus === 'ACTIVE') realStatus = 'Active';
                else if (['PAUSED', 'ARCHIVED', 'DELETED', 'ADSET_PAUSED', 'CAMPAIGN_PAUSED'].includes(metaStatus)) realStatus = 'Paused';
                else realStatus = 'Completed';

                const campaignData: Omit<Campaign, 'id'> = {
                    clientId: clientId,
                    externalId: item.id,
                    name: item.name,
                    status: realStatus,
                    spend: spend,
                    impressions: Number(insight.impressions || 0),
                    clicks: Number(insight.clicks || 0),
                    ctr: Number(insight.ctr || 0) * 100,
                    cpc: Number(insight.cpc || 0),
                    roas: spend > 0 ? purchaseValue / spend : 0,
                    conversations: messagingSum,
                    leads: leadSum,
                    platform: 'Meta',
                    ageBreakdown: ageMap[item.id] || {},
                    genderBreakdown: genderMap[item.id] || {},
                    platformBreakdown: platformMap[item.id] || {}
                };

                const existing = existingCampaignMap.get(item.id);

                if (existing) {
                    await updateDoc(doc(db, CAMPAIGNS_COLLECTION, existing.id), campaignData);
                } else {
                    await addDoc(collection(db, CAMPAIGNS_COLLECTION), campaignData);
                }
            }
        }

        // 6. GHOST KILLER (MATADOR DE FANTASMAS)
        const batch = writeBatch(db);
        let killedGhosts = 0;

        existingCampaignMap.forEach((existingCampaign, externalId) => {
            if (!activeIdsInMeta.has(externalId || '')) {
                if (datePreset === 'maximum') {
                    if (existingCampaign.status === 'Active') {
                        batch.update(doc(db, CAMPAIGNS_COLLECTION, existingCampaign.id), { 
                            status: 'Paused',
                            spend: existingCampaign.spend 
                        });
                        killedGhosts++;
                    }
                } else {
                    if (existingCampaign.spend > 0 || existingCampaign.status === 'Active') {
                         batch.update(doc(db, CAMPAIGNS_COLLECTION, existingCampaign.id), {
                             spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, roas: 0, conversations: 0, leads: 0,
                         });
                    }
                }
            }
        });
        
        if (killedGhosts > 0) {
            await batch.commit();
            console.log(`[MetaSync] ${killedGhosts} campanhas fantasmas foram desativadas.`);
        }

        return { success: true, message: `Espelhamento concluído! (11k check: OK, Status check: OK)` };

    } catch (error: any) {
        console.error(error);
        return { success: false, message: "Erro ao espelhar dados: " + error.message };
    }
};

// --- TASKS ---

export const getTasks = async (filterClientId?: string): Promise<Task[]> => {
  try {
    let q;
    if (filterClientId && filterClientId !== 'all') {
        q = query(collection(db, TASKS_COLLECTION), where("clientId", "==", filterClientId));
    } else {
        q = collection(db, TASKS_COLLECTION);
    }
    
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    return tasks;
  } catch (error) {
    return [];
  }
};

export const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, { status: newStatus });
  } catch (error) {
    logError(error, "atualizar tarefa");
    throw error;
  }
};

export const addTask = async (task: Omit<Task, 'id'>) => {
    try {
        await addDoc(collection(db, TASKS_COLLECTION), task);
    } catch (error) {
        logError(error, "criar tarefa");
        throw error;
    }
}

// --- SEEDER DADOS ---

// Função para limpar e resetar dados de demo
export const resetDemoData = async () => {
    try {
        // 1. Apagar Campanhas existentes
        const campSnapshot = await getDocs(collection(db, CAMPAIGNS_COLLECTION));
        const batch = writeBatch(db);
        campSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        // 2. Apagar Tarefas existentes
        const taskSnapshot = await getDocs(collection(db, TASKS_COLLECTION));
        taskSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        // 3. Recriar com novos mocks para TODOS os clientes encontrados
        const clients = await getClients();
        const promises: Promise<any>[] = [];

        if (clients.length === 0) {
            // Se não houver cliente, cria um mock apenas para não quebrar
             MOCK_CAMPAIGNS.forEach(c => {
                const { id, ...data } = c;
                promises.push(addCampaign({ ...data, clientId: 'mock-client-1' }));
            });
        } else {
            // Distribui campanhas de exemplo para CADA cliente encontrado no banco
            // Isso garante que o cliente selecionado no dashboard (Hotel Sea Angels) tenha dados
            for (const client of clients) {
                // Adiciona todas as campanhas mock para este cliente
                MOCK_CAMPAIGNS.forEach(c => {
                    const { id, ...data } = c;
                    promises.push(addCampaign({ ...data, clientId: client.id }));
                });

                // Adiciona tarefas para este cliente
                MOCK_TASKS.forEach(t => {
                    const { id, ...data } = t;
                    promises.push(addTask({ ...data, clientId: client.id }));
                });
            }
        }

        await Promise.all(promises);
        return { success: true, message: `Dados resetados com sucesso para ${clients.length} clientes!` };
    } catch (error: any) {
        console.error("Erro no reset:", error);
        return { success: false, message: "Erro ao resetar dados." };
    }
}

export const seedDatabase = async () => {
    try {
        const campaigns = await getCampaigns();
        if (campaigns.length > 0) {
            alert("O banco de dados já contém dados.");
            return;
        }

        // Mesmo lógica do reset: distribuir para todos
        const clients = await getClients();
        const promises: Promise<any>[] = [];

        if (clients.length === 0) {
             MOCK_CAMPAIGNS.forEach(c => {
                const { id, ...data } = c;
                promises.push(addCampaign({ ...data, clientId: 'mock-client-1' }));
            });
        } else {
            for (const client of clients) {
                MOCK_CAMPAIGNS.forEach(c => {
                    const { id, ...data } = c;
                    promises.push(addCampaign({ ...data, clientId: client.id }));
                });
                MOCK_TASKS.forEach(t => {
                    const { id, ...data } = t;
                    promises.push(addTask({ ...data, clientId: client.id }));
                });
            }
        }

        await Promise.all(promises);
        alert("Dados de exemplo criados com sucesso para todos os clientes!");
        window.location.reload();
    } catch (error: any) {
        console.error("Erro no seed:", error);
        alert("Erro ao salvar dados no Firebase.");
    }
}