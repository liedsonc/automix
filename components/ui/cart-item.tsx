import { createImage } from '@gluestack-ui/core/image/creator';
import { createPressable } from '@gluestack-ui/core/pressable/creator';
import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, type ComponentRef, useState, useEffect } from 'react';
import {
	Image,
	Pressable,
	Text,
	View,
	type ImageProps,
	type PressableProps,
	type TextProps,
	type ViewProps,
} from 'react-native';

type WithClassName<P> = P & {
	className?: string;
};

const StyledCartItemRoot = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`bg-white rounded-lg p-3 flex-row ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCartItemRoot.displayName = 'StyledCartItemRoot';

const StyledCartItemImageContainer = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`w-24 h-24 rounded-lg overflow-hidden mr-3 relative ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCartItemImageContainer.displayName = 'StyledCartItemImageContainer';

const StyledCartItemImage = forwardRef<ComponentRef<typeof Image>, WithClassName<ImageProps>>(
	({ className = '', style, ...props }, ref) => (
		<Image
			ref={ref}
			className={`w-full h-full ${className}`}
			style={style}
			resizeMode='cover'
			{...props}
		/>
	),
);
StyledCartItemImage.displayName = 'StyledCartItemImage';

const StyledCartItemDeleteButton = forwardRef<
	ComponentRef<typeof Pressable>,
	WithClassName<PressableProps>
>(({ className = '', style, ...props }, ref) => (
	<Pressable
		ref={ref}
		className={`absolute bottom-1 left-1 w-6 h-6 bg-[color:var(--red)] rounded-full items-center justify-center ${className}`}
		style={style}
		{...props}
	/>
));
StyledCartItemDeleteButton.displayName = 'StyledCartItemDeleteButton';

const StyledCartItemContent = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`flex-1 relative ${className}`} style={style} {...props} />
	),
);
StyledCartItemContent.displayName = 'StyledCartItemContent';

const StyledCartItemName = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-base mb-1 ${className}`}
			style={style}
			numberOfLines={2}
			{...props}
		/>
	),
);
StyledCartItemName.displayName = 'StyledCartItemName';

const StyledCartItemStock = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-sm mb-1 opacity-70 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCartItemStock.displayName = 'StyledCartItemStock';

const StyledCartItemPrice = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-lg font-semibold mb-1 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCartItemPrice.displayName = 'StyledCartItemPrice';

const StyledCartItemQuantityContainer = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`flex-row items-center self-end ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCartItemQuantityContainer.displayName = 'StyledCartItemQuantityContainer';

const StyledCartItemQuantityButton = forwardRef<
	ComponentRef<typeof Pressable>,
	WithClassName<PressableProps>
>(({ className = '', style, ...props }, ref) => (
	<Pressable
		ref={ref}
		className={`w-8 h-8 rounded-full bg-[color:var(--primary)] items-center justify-center ${className}`}
		style={style}
		{...props}
	/>
));
StyledCartItemQuantityButton.displayName = 'StyledCartItemQuantityButton';

const StyledCartItemQuantityDisplay = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`w-10 h-8 bg-white border border-[color:var(--primary-light)] items-center justify-center mx-2 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCartItemQuantityDisplay.displayName = 'StyledCartItemQuantityDisplay';

const StyledCartItemQuantityText = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-sm ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCartItemQuantityText.displayName = 'StyledCartItemQuantityText';

const GluestackCartItemImage = createImage({
	Root: StyledCartItemImage,
});

const GluestackCartItemDeleteButton = createPressable({
	Root: StyledCartItemDeleteButton,
});

const GluestackCartItemQuantityButton = createPressable({
	Root: StyledCartItemQuantityButton,
});

type CartItemProps = {
	imageSource: ImageProps['source'];
	name: string;
	stock: string;
	price: string;
	initialQuantity?: number;
	onDelete?: () => void;
	onQuantityChange?: (quantity: number) => void;
	className?: string;
	imageClassName?: string;
	contentClassName?: string;
	nameClassName?: string;
	stockClassName?: string;
	priceClassName?: string;
	quantityClassName?: string;
};

export function CartItem({
	imageSource,
	name,
	stock,
	price,
	initialQuantity = 1,
	onDelete,
	onQuantityChange,
	className = '',
	imageClassName = '',
	contentClassName = '',
	nameClassName = '',
	stockClassName = '',
	priceClassName = '',
	quantityClassName = '',
}: CartItemProps) {
	const [quantity, setQuantity] = useState(initialQuantity);

	useEffect(() => {
		setQuantity(initialQuantity);
	}, [initialQuantity]);

	const stockNumber = parseInt(stock.match(/\d+/)?.[0] || '0', 10);
	const maxQuantity = stockNumber;

	const handleDecrease = () => {
		if (quantity > 1) {
			const newQuantity = quantity - 1;
			setQuantity(newQuantity);
			onQuantityChange?.(newQuantity);
		}
	};

	const handleIncrease = () => {
		if (quantity < maxQuantity) {
			const newQuantity = quantity + 1;
			setQuantity(newQuantity);
			onQuantityChange?.(newQuantity);
		}
	};

	const handleDelete = () => {
		onDelete?.();
	};

	const canIncrease = quantity < maxQuantity;
	const canDecrease = quantity > 1;

	return (
		<StyledCartItemRoot className={className}>
			<StyledCartItemImageContainer className={imageClassName}>
				<GluestackCartItemImage source={imageSource} className='w-full h-full' />
				<GluestackCartItemDeleteButton onPress={handleDelete}>
					<Ionicons name='trash' size={14} color='#FFFFFF' />
				</GluestackCartItemDeleteButton>
			</StyledCartItemImageContainer>
			<StyledCartItemContent className={contentClassName}>
				<StyledCartItemName className={nameClassName}>{name}</StyledCartItemName>
				<StyledCartItemPrice className={priceClassName}>{price}</StyledCartItemPrice>
				<View className='absolute bottom-0 right-0 z-10 items-end'>
					<StyledCartItemStock className={stockClassName}>{stock}</StyledCartItemStock>
					<StyledCartItemQuantityContainer className={quantityClassName}>
						<GluestackCartItemQuantityButton
							onPress={handleDecrease}
							className={!canDecrease ? 'opacity-50' : ''}
							disabled={!canDecrease}
						>
							<Ionicons name='remove' size={16} color='#FFFFFF' />
						</GluestackCartItemQuantityButton>
						<StyledCartItemQuantityDisplay>
							<StyledCartItemQuantityText>{quantity}</StyledCartItemQuantityText>
						</StyledCartItemQuantityDisplay>
						<GluestackCartItemQuantityButton
							onPress={handleIncrease}
							className={!canIncrease ? 'opacity-50' : ''}
							disabled={!canIncrease}
						>
							<Ionicons name='add' size={16} color='#FFFFFF' />
						</GluestackCartItemQuantityButton>
					</StyledCartItemQuantityContainer>
				</View>
			</StyledCartItemContent>
		</StyledCartItemRoot>
	);
}
