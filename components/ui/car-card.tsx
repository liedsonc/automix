import { forwardRef } from 'react';
import { Text, View, type TextProps, type ViewProps } from 'react-native';

type WithClassName<P> = P & {
	className?: string;
};

const StyledCarCardRoot = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`bg-white rounded-lg shadow-sm elevation-2 mb-3 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCarCardRoot.displayName = 'StyledCarCardRoot';

const StyledCarCardHeader = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`bg-[color:var(--primary)] rounded-t-lg px-4 py-3 items-center ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCarCardHeader.displayName = 'StyledCarCardHeader';

const StyledCarCardLicensePlate = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-white text-lg font-bold ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCarCardLicensePlate.displayName = 'StyledCarCardLicensePlate';

const StyledCarCardContent = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`px-4 py-3 ${className}`} style={style} {...props} />
	),
);
StyledCarCardContent.displayName = 'StyledCarCardContent';

const StyledCarCardDetail = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-base mb-1 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCarCardDetail.displayName = 'StyledCarCardDetail';

type CarCardProps = {
	licensePlate: string;
	brand: string;
	model: string;
	engine: string;
	year: string;
	className?: string;
	headerClassName?: string;
	licensePlateClassName?: string;
	contentClassName?: string;
	detailClassName?: string;
};

export function CarCard({
	licensePlate,
	brand,
	model,
	engine,
	year,
	className = '',
	headerClassName = '',
	licensePlateClassName = '',
	contentClassName = '',
	detailClassName = '',
}: CarCardProps) {
	return (
		<StyledCarCardRoot className={className}>
			<StyledCarCardHeader className={headerClassName}>
				<StyledCarCardLicensePlate className={licensePlateClassName}>
					{licensePlate}
				</StyledCarCardLicensePlate>
			</StyledCarCardHeader>
			<StyledCarCardContent className={contentClassName}>
				<StyledCarCardDetail className={detailClassName}>
					<Text className='font-bold'>Marca:</Text> {brand}
				</StyledCarCardDetail>
				<StyledCarCardDetail className={detailClassName}>
					<Text className='font-bold'>Modelo:</Text> {model}
				</StyledCarCardDetail>
				<StyledCarCardDetail className={detailClassName}>
					<Text className='font-bold'>Motor:</Text> {engine}
				</StyledCarCardDetail>
				<StyledCarCardDetail className={detailClassName}>
					<Text className='font-bold'>Ano:</Text> {year}
				</StyledCarCardDetail>
			</StyledCarCardContent>
		</StyledCarCardRoot>
	);
}
