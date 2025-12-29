export enum OrderStatus {
	AGUARDA_PAGAMENTO = 'AGUARDA PAGAMENTO',
	ENVIADO = 'ENVIADO',
	DEVOLVIDO = 'DEVOLVIDO',
	ENTREGUE = 'ENTREGUE',
}

export const getOrderStatusColor = (status: OrderStatus): string => {
	switch (status) {
		case OrderStatus.AGUARDA_PAGAMENTO:
			return '#3498DB';
		case OrderStatus.ENVIADO:
			return '#009688';
		case OrderStatus.DEVOLVIDO:
			return '#FF5F00';
		case OrderStatus.ENTREGUE:
			return '#17BE5A';
		default:
			return '#9CA3AF';
	}
};
