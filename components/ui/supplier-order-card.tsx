import { createPressable } from '@gluestack-ui/core/pressable/creator';
import { forwardRef, type ComponentRef } from 'react';
import {
	Pressable,
	Text,
	View,
	type PressableProps,
	type TextProps,
	type ViewProps,
} from 'react-native';
import { OrderStatus, getOrderStatusColor } from '@/types/order-status';

type WithClassName<P> = P & {
	className?: string;
};

const StyledSupplierOrderCardRoot = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`bg-white border-b border-[color:var(--primary-light)] pb-3 mb-3 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardRoot.displayName = 'StyledSupplierOrderCardRoot';

const StyledSupplierOrderCardHeader = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`flex-row justify-between items-start mb-2 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardHeader.displayName = 'StyledSupplierOrderCardHeader';

const StyledSupplierOrderCardLeftSection = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`flex-1 ${className}`} style={style} {...props} />
	),
);
StyledSupplierOrderCardLeftSection.displayName = 'StyledSupplierOrderCardLeftSection';

const StyledSupplierOrderCardOrderId = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-lg font-bold mb-1 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardOrderId.displayName = 'StyledSupplierOrderCardOrderId';

const StyledSupplierOrderCardShipping = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-base opacity-70 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardShipping.displayName = 'StyledSupplierOrderCardShipping';

const StyledSupplierOrderCardDate = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-base ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardDate.displayName = 'StyledSupplierOrderCardDate';

const StyledSupplierOrderCardStatusContainer = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`flex-row items-center justify-between mb-2 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardStatusContainer.displayName = 'StyledSupplierOrderCardStatusContainer';

const StyledSupplierOrderCardStatusLabel = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-base mr-2 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardStatusLabel.displayName = 'StyledSupplierOrderCardStatusLabel';

const StyledSupplierOrderCardStatusTag = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`px-3 py-1 rounded-full ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardStatusTag.displayName = 'StyledSupplierOrderCardStatusTag';

const StyledSupplierOrderCardStatusText = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-white text-sm font-semibold ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledSupplierOrderCardStatusText.displayName = 'StyledSupplierOrderCardStatusText';

const StyledSupplierOrderCardViewButton = forwardRef<
	ComponentRef<typeof Pressable>,
	WithClassName<PressableProps>
>(({ className = '', style, ...props }, ref) => (
	<Pressable
		ref={ref}
		className={`px-4 py-2 bg-[color:var(--primary)] rounded-lg ${className}`}
		style={style}
		{...props}
	/>
));
StyledSupplierOrderCardViewButton.displayName = 'StyledSupplierOrderCardViewButton';

const GluestackSupplierOrderCardViewButton = createPressable({
	Root: StyledSupplierOrderCardViewButton,
});

type SupplierOrderCardProps = {
	orderId: string;
	shippingNumber: string;
	date: string;
	status: OrderStatus;
	onViewPress?: () => void;
	className?: string;
	headerClassName?: string;
	leftSectionClassName?: string;
	orderIdClassName?: string;
	shippingClassName?: string;
	dateClassName?: string;
	statusContainerClassName?: string;
	statusLabelClassName?: string;
	statusTagClassName?: string;
	statusTextClassName?: string;
	viewButtonClassName?: string;
};

export function SupplierOrderCard({
	orderId,
	shippingNumber,
	date,
	status,
	onViewPress,
	className = '',
	headerClassName = '',
	leftSectionClassName = '',
	orderIdClassName = '',
	shippingClassName = '',
	dateClassName = '',
	statusContainerClassName = '',
	statusLabelClassName = '',
	statusTagClassName = '',
	statusTextClassName = '',
	viewButtonClassName = '',
}: SupplierOrderCardProps) {
	const statusColor = getOrderStatusColor(status);

	return (
		<StyledSupplierOrderCardRoot className={className}>
			<StyledSupplierOrderCardHeader className={headerClassName}>
				<StyledSupplierOrderCardLeftSection className={leftSectionClassName}>
					<StyledSupplierOrderCardOrderId className={orderIdClassName}>
						Pedido #{orderId}
					</StyledSupplierOrderCardOrderId>
					<StyledSupplierOrderCardShipping className={shippingClassName}>
						Nº. Expedição: {shippingNumber}
					</StyledSupplierOrderCardShipping>
				</StyledSupplierOrderCardLeftSection>
				<StyledSupplierOrderCardDate className={dateClassName}>
					{date}
				</StyledSupplierOrderCardDate>
			</StyledSupplierOrderCardHeader>
			<StyledSupplierOrderCardStatusContainer className={statusContainerClassName}>
				<View className='flex-row items-center'>
					<StyledSupplierOrderCardStatusLabel className={statusLabelClassName}>
						Estado:
					</StyledSupplierOrderCardStatusLabel>
					<StyledSupplierOrderCardStatusTag
						className={statusTagClassName}
						style={{ backgroundColor: statusColor }}
					>
						<StyledSupplierOrderCardStatusText className={statusTextClassName}>
							{status}
						</StyledSupplierOrderCardStatusText>
					</StyledSupplierOrderCardStatusTag>
				</View>
				<GluestackSupplierOrderCardViewButton
					className={viewButtonClassName}
					onPress={onViewPress}
				>
					<Text className='text-white text-base font-semibold'>Ver</Text>
				</GluestackSupplierOrderCardViewButton>
			</StyledSupplierOrderCardStatusContainer>
		</StyledSupplierOrderCardRoot>
	);
}
