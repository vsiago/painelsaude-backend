import express, { json } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'

const app = express();
dotenv.config();

app.use(json());
app.use(cors());

app.get('/leitos', (req, res) => {
    const getLeitos = async () => {
        try {
            const response = await fetch('http://192.168.6.206:8080/novointernado/unidadenir/HMSFX/quem/internados');
            if (!response.ok) throw new Error('Erro na requisição');

            const pacientesLeitos = await response.json();

            const leitoData = {
                TotalDeLeitos: 200,
                PacientesNoLeito: pacientesLeitos,
                LeitosDisponiveis: 200 - pacientesLeitos,
            };

            res.status(200).json(leitoData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar dados' });
        }
    };
    getLeitos();
});

app.get('/classificaoderisco/:id', (req, res) => {
    const data = req.params.id;

    const getClassficacao = async () => {
        try {
            const response = await fetch(`http://10.200.200.120:8080/avaliacao/unidadeclass/HMSFX/data/${data}`);
            if (!response.ok) throw new Error('Erro na requisição');

            const classificacoesData = await response.json();

            // Mapeamento de cores para suas descrições
            const corParaDescricao = {
                "1": "NaoUrgente",
                "2": "PoucoUrgente",
                "3": "Urgencia",
                "4": "AltaUrgencia",
                "5": "Emergencia"
            };

            // Soma os itens por cor e renomeia as chaves
            const somaPorCor = classificacoesData.reduce((acc, item) => {
                if (item.cor) {
                    const descricaoClassificacao = corParaDescricao[item.cor] || `classificacaoDeRisco${item.cor}`;
                    acc[descricaoClassificacao] = (acc[descricaoClassificacao] || 0) + 1;
                }
                return acc;
            }, {});

            // Envia o resultado
            res.status(200).json(somaPorCor);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar dados' });
        }
    };

    getClassficacao();
});

app.get('/numeroatendimentos', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:3333/classificaoderisco/2025-01-05`);
        if (!response.ok) throw new Error('Erro na requisição');

        const classificacoes = await response.json();

        // Soma todos os valores do objeto de classificações
        const totalAtendimentos = Object.values(classificacoes).reduce((soma, valor) => soma + valor, 0);

        // Retorna o total como resposta
        res.status(200).json({ totalAtendimentos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

app.get('/historicoatendimentos', async (req, res) => {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear(); // Ano atual
        const month = currentDate.getMonth();  // Mês atual (Janeiro = 0)

        // Mês fixo de janeiro de 2025 para este exemplo
        const targetYear = 2025;
        const targetMonth = 0; // Janeiro (base 0)

        // Calcula o número de dias no mês
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

        const atendimentos = [];

        // Gera histórico para cada dia do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Faz requisição para obter os atendimentos da data
            const response = await fetch(`http://localhost:3333/classificaoderisco/${dateString}`);
            if (!response.ok) throw new Error(`Erro na requisição para a data ${dateString}`);

            const data = await response.json();

            // Calcula o total de atendimentos para o dia
            const totalAtendimentosDia = Object.values(data).reduce((sum, value) => sum + value, 0);

            atendimentos.push({ data: dateString, total: totalAtendimentosDia });
        }

        // Responde com o histórico
        res.status(200).json(atendimentos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar histórico de atendimentos' });
    }
});

app.get('/resumomedico', async (req, res) => {
    try {
        // Fazendo a requisição para a API
        const response = await fetch('http://192.168.6.206:8080/resumomedico/data/2024-05-10/unidade/HMSFX');
        if (!response.ok) throw new Error('Erro na requisição');

        const dadosAtendimentos = await response.json();

        // Agrupar os médicos e somar os atendimentos
        const agrupadosPorMedico = dadosAtendimentos.reduce((acc, atendimento) => {
            const medicoNome = atendimento.medico;
            const totalAtendimentos = atendimento.totalatendimentos;

            // Se o médico já existir no acumulador, soma os atendimentos
            if (acc[medicoNome]) {
                acc[medicoNome].totalAtendimentos += totalAtendimentos;
            } else {
                // Caso contrário, cria um novo objeto para o médico
                acc[medicoNome] = {
                    medico: medicoNome,
                    totalAtendimentos: totalAtendimentos,
                    setor: atendimento.setor,
                    unidade: atendimento.unidade
                };
            }

            return acc;
        }, {});

        // Convertendo o objeto agrupado para um array
        const resultadoAgrupado = Object.values(agrupadosPorMedico);

        // Retorna os dados agrupados
        res.status(200).json(resultadoAgrupado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});





const PORT = process.env.PORT || 5000;
app.listen(3333, () => console.log(`Server running on port ${PORT}`));
