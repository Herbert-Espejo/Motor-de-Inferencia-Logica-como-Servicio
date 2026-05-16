% ============================================================
% BASE DE CONOCIMIENTO - Motor de Inferencia Lógica
% Dominio: Contratos y Penalizaciones
% ============================================================

% --- HECHOS: Contratos ---
contract(contract1).
contract(contract2).
contract(contract3).
contract(contract4).

% --- HECHOS: Estado de los contratos ---
expired(contract1).
expired(contract3).
active(contract2).
active(contract4).

% --- HECHOS: Incumplimientos reportados ---
breach_reported(contract1).
breach_reported(contract3).
breach_reported(contract4).

% --- HECHOS: Contratos con cláusula de penalización ---
has_penalty_clause(contract1).
has_penalty_clause(contract2).
has_penalty_clause(contract3).

% --- HECHOS: Montos de penalización (en USD) ---
penalty_amount(contract1, 5000).
penalty_amount(contract2, 3000).
penalty_amount(contract3, 8000).

% --- HECHOS: Clientes asociados a contratos ---
client(contract1, acme_corp).
client(contract2, globex_inc).
client(contract3, initech).
client(contract4, umbrella_ltd).

% --- HECHOS: Tipo de contrato ---
contract_type(contract1, services).
contract_type(contract2, supply).
contract_type(contract3, services).
contract_type(contract4, consulting).

% ============================================================
% REGLAS DE INFERENCIA
% ============================================================

% Una penalización es aplicable si:
%   - El contrato existe
%   - Está expirado
%   - Tiene cláusula de penalización
%   - Se reportó incumplimiento
penalty_applicable(Contract) :-
    contract(Contract),
    expired(Contract),
    has_penalty_clause(Contract),
    breach_reported(Contract).

% Un contrato está en riesgo si está activo y tiene incumplimiento reportado
at_risk(Contract) :-
    contract(Contract),
    active(Contract),
    breach_reported(Contract).

% Un contrato es válido (activo y sin incumplimiento)
valid_contract(Contract) :-
    contract(Contract),
    active(Contract),
    \+ breach_reported(Contract).

% Relación: cliente con penalización aplicable
client_penalized(Client) :-
    contract(Contract),
    penalty_applicable(Contract),
    client(Contract, Client).

% Obtener monto de penalización si es aplicable
applicable_penalty_amount(Contract, Amount) :-
    penalty_applicable(Contract),
    penalty_amount(Contract, Amount).

% Contratos del mismo tipo
same_type(Contract1, Contract2) :-
    contract(Contract1),
    contract(Contract2),
    Contract1 \= Contract2,
    contract_type(Contract1, Type),
    contract_type(Contract2, Type).
