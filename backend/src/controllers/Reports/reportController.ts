import { Request, Response } from 'express';
import { Report } from '../../models/Reports/Report';
import { User } from '../../models/Users/User';
import { Op } from 'sequelize';

interface ReportRequestBody {
    reported_user_id: number;
    reason: string;
    description?: string;
}

interface AdminActionBody {
    status?: 'reviewed' | 'resolved' | 'dismissed';
    admin_notes?: string;
    ban_user?: boolean;
}

// Criar um novo report
export const createReport = async (req: Request<{}, {}, ReportRequestBody>, res: Response) => {
    try {
        const { reported_user_id, reason, description } = req.body;
        const reporter_id = req.userId;

        if (!reporter_id) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        if (!reported_user_id || !reason) {
            return res.status(400).json({ message: 'ID do usuário reportado e motivo são obrigatórios.' });
        }

        // Verificar se o usuário reportado existe
        const reportedUser = await User.findByPk(reported_user_id);
        if (!reportedUser) {
            return res.status(404).json({ message: 'Usuário reportado não encontrado.' });
        }

        // Verificar se o usuário não está se reportando
        if (Number(reporter_id) === Number(reported_user_id)) {
            return res.status(400).json({ message: 'Você não pode se reportar.' });
        }

        // Verificar se já existe um report pendente desse usuário para o mesmo alvo
        const existingReport = await Report.findOne({
            where: {
                reporter_id,
                reported_user_id,
                status: 'pending'
            }
        });

        if (existingReport) {
            return res.status(409).json({ message: 'Você já reportou este usuário. Aguarde análise.' });
        }

        const newReport = await Report.create({
            reporter_id,
            reported_user_id,
            reason,
            description
        });

        res.status(201).json({ 
            message: 'Report enviado com sucesso. Nossa equipe irá analisar.',
            report: newReport 
        });
    } catch (error) {
        console.error('Erro ao criar report:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Listar todos os reports (apenas para admins)
export const listReports = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        
        // Verificar se é admin
        const user = await User.findByPk(userId);
        if (!user?.is_admin) {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const { status, page = 1, limit = 20, search, banned, username, email, reason } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const whereClause: any = {};
        if (status) {
            whereClause.status = status;
        }

        // Configurar includes básicos
        let includeClause: any[] = [
            {
                model: User,
                as: 'reporter',
                attributes: ['id', 'username', 'email']
            },
            {
                model: User,
                as: 'reportedUser',
                attributes: ['id', 'username', 'email', 'ban']
            }
        ];

        // Filtro de usuários banidos
        if (banned !== undefined) {
            const isBanned = banned === 'true';
            includeClause[1].where = {
                ban: isBanned
            };
        }

        // Filtro de search - busca por email, username ou motivo
        if (search) {
            // Buscar no motivo e descrição do report ou nos dados dos usuários
            whereClause[Op.or] = [
                // Busca no motivo e descrição do report
                { reason: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                // Busca nos dados do reporter
                { '$reporter.username$': { [Op.iLike]: `%${search}%` } },
                { '$reporter.email$': { [Op.iLike]: `%${search}%` } },
                // Busca nos dados do usuário reportado
                { '$reportedUser.username$': { [Op.iLike]: `%${search}%` } },
                { '$reportedUser.email$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        const reports = await Report.findAndCountAll({
            where: whereClause,
            include: includeClause,
            order: [['createdAt', 'DESC']],
            limit: Number(limit),
            offset
        });

        res.json({
            reports: reports.rows,
            pagination: {
                current_page: Number(page),
                total_pages: Math.ceil(reports.count / Number(limit)),
                total_reports: reports.count,
                per_page: Number(limit)
            }
        });
    } catch (error) {
        console.error('Erro ao listar reports:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Atualizar status de um report (apenas para admins)
export const updateReportStatus = async (req: Request<{ id: string }, {}, AdminActionBody>, res: Response) => {
    try {
        const userId = req.userId;
        const reportId = req.params.id;
        const { status, admin_notes } = req.body;

        // Verificar se é admin
        const user = await User.findByPk(userId);
        if (!user?.is_admin) {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const report = await Report.findByPk(reportId, {
            include: [
                {
                    model: User,
                    as: 'reportedUser',
                    attributes: ['id', 'username', 'ban']
                }
            ]
        });

        if (!report) {
            return res.status(404).json({ message: 'Report não encontrado.' });
        }

        if (status) {
            report.status = status;
        }
        
        if (admin_notes !== undefined) {
            report.admin_notes = admin_notes;
        }

        await report.save();

        res.json({ 
            message: 'Status do report atualizado com sucesso.',
            report 
        });
    } catch (error) {
        console.error('Erro ao atualizar report:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Banir usuário através de um report
export const banUserFromReport = async (req: Request<{ id: string }, {}, AdminActionBody>, res: Response) => {
    try {
        const userId = req.userId;
        const reportId = req.params.id;
        const { admin_notes } = req.body;

        // Verificar se é admin
        const user = await User.findByPk(userId);
        if (!user?.is_admin) {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const report = await Report.findByPk(reportId, {
            include: [
                {
                    model: User,
                    as: 'reportedUser'
                }
            ]
        });

        if (!report) {
            return res.status(404).json({ message: 'Report não encontrado.' });
        }

        const reportedUser = (report as any).reportedUser;
        if (!reportedUser) {
            return res.status(404).json({ message: 'Usuário reportado não encontrado.' });
        }

        // Banir o usuário
        reportedUser.ban = true;
        await reportedUser.save();

        // Atualizar o report
        report.status = 'resolved';
        report.admin_notes = admin_notes || `Usuário banido pelo admin ${user.username}`;
        await report.save();

        res.json({ 
            message: `Usuário ${reportedUser.username} foi banido com sucesso.`,
            report,
            banned_user: {
                id: reportedUser.id,
                username: reportedUser.username,
                banned: true
            }
        });
    } catch (error) {
        console.error('Erro ao banir usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Desbanir usuário
export const unbanUser = async (req: Request<{ userId: string }, {}, { admin_notes?: string }>, res: Response) => {
    try {
        const adminId = req.userId;
        const targetUserId = req.params.userId;
        const { admin_notes } = req.body;

        // Verificar se é admin
        const admin = await User.findByPk(adminId);
        if (!admin?.is_admin) {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (!targetUser.ban) {
            return res.status(400).json({ message: 'Usuário não está banido.' });
        }

        // Desbanir o usuário
        targetUser.ban = false;
        await targetUser.save();

        // Atualizar todos os reports relacionados a este usuário que estavam em resolved
        await Report.update(
            { 
                status: 'dismissed',
                admin_notes: admin_notes || `Usuário desbanido pelo admin ${admin.username}`
            },
            { 
                where: { 
                    reported_user_id: targetUserId,
                    status: 'resolved'
                } 
            }
        );

        res.json({ 
            message: `Usuário ${targetUser.username} foi desbanido com sucesso.`,
            user: {
                id: targetUser.id,
                username: targetUser.username,
                banned: false
            }
        });
    } catch (error) {
        console.error('Erro ao desbanir usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Estatísticas de reports (para admin dashboard)
export const getReportsStats = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        // Verificar se é admin
        const user = await User.findByPk(userId);
        if (!user?.is_admin) {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const stats = await Report.findAll({
            attributes: [
                'status',
                [Report.sequelize!.fn('COUNT', Report.sequelize!.col('id')), 'count']
            ],
            group: ['status']
        });

        const bannedUsersCount = await User.count({
            where: { ban: true }
        });

        const totalReports = await Report.count();

        res.json({
            reports_by_status: stats,
            total_reports: totalReports,
            banned_users: bannedUsersCount
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};