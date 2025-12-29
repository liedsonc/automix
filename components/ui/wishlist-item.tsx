import { createImage } from '@gluestack-ui/core/image/creator';
import { createPressable } from '@gluestack-ui/core/pressable/creator';
import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, type ComponentRef } from 'react';
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

const StyledWishlistItemRoot = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`bg-white rounded-lg p-3 flex-row mb-3 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledWishlistItemRoot.displayName = 'StyledWishlistItemRoot';

const StyledWishlistItemImageContainer = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`w-24 h-24 rounded-lg overflow-hidden mr-3 relative ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledWishlistItemImageContainer.displayName = 'StyledWishlistItemImageContainer';

const StyledWishlistItemImage = forwardRef<ComponentRef<typeof Image>, WithClassName<ImageProps>>(
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
StyledWishlistItemImage.displayName = 'StyledWishlistItemImage';

const StyledWishlistItemDeleteButton = forwardRef<
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
StyledWishlistItemDeleteButton.displayName = 'StyledWishlistItemDeleteButton';

const StyledWishlistItemContent = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`flex-1 relative ${className}`} style={style} {...props} />
	),
);
StyledWishlistItemContent.displayName = 'StyledWishlistItemContent';

const StyledWishlistItemName = forwardRef<Text, WithClassName<TextProps>>(
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
StyledWishlistItemName.displayName = 'StyledWishlistItemName';

const StyledWishlistItemPriceContainer = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`flex-row items-center mb-1 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledWishlistItemPriceContainer.displayName = 'StyledWishlistItemPriceContainer';

const StyledWishlistItemOldPrice = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--red)] text-sm line-through mr-2 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledWishlistItemOldPrice.displayName = 'StyledWishlistItemOldPrice';

const StyledWishlistItemPrice = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-lg font-semibold ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledWishlistItemPrice.displayName = 'StyledWishlistItemPrice';

const StyledWishlistItemStock = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-sm mb-1 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledWishlistItemStock.displayName = 'StyledWishlistItemStock';

const StyledWishlistItemTagsContainer = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`flex-row flex-wrap gap-2 mb-2 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledWishlistItemTagsContainer.displayName = 'StyledWishlistItemTagsContainer';

const StyledWishlistItemTag = forwardRef<
	ComponentRef<typeof Pressable>,
	WithClassName<PressableProps>
>(({ className = '', style, ...props }, ref) => (
	<Pressable
		ref={ref}
		className={`px-3 py-1 rounded-full bg-[color:var(--primary-light)] ${className}`}
		style={style}
		{...props}
	/>
));
StyledWishlistItemTag.displayName = 'StyledWishlistItemTag';

const StyledWishlistItemTagText = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--primary)] text-xs ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledWishlistItemTagText.displayName = 'StyledWishlistItemTagText';

const StyledWishlistItemAddToCartButton = forwardRef<
	ComponentRef<typeof Pressable>,
	WithClassName<PressableProps>
>(({ className = '', style, ...props }, ref) => (
	<Pressable
		ref={ref}
		className={`w-10 h-10 rounded-full bg-[color:var(--primary)] items-center justify-center ${className}`}
		style={style}
		{...props}
	/>
));
StyledWishlistItemAddToCartButton.displayName = 'StyledWishlistItemAddToCartButton';

const GluestackWishlistItemImage = createImage({
	Root: StyledWishlistItemImage,
});

const GluestackWishlistItemDeleteButton = createPressable({
	Root: StyledWishlistItemDeleteButton,
});

const GluestackWishlistItemAddToCartButton = createPressable({
	Root: StyledWishlistItemAddToCartButton,
});

const GluestackWishlistItemTag = createPressable({
	Root: StyledWishlistItemTag,
});

type WishlistItemProps = {
	imageSource: ImageProps['source'];
	name: string;
	price: string;
	oldPrice?: string;
	stock: string;
	tags: string[];
	onDelete?: () => void;
	onAddToCart?: () => void;
	onTagPress?: (tag: string) => void;
	className?: string;
	imageClassName?: string;
	contentClassName?: string;
	nameClassName?: string;
	priceClassName?: string;
	stockClassName?: string;
	tagsClassName?: string;
};

export function WishlistItem({
	imageSource,
	name,
	price,
	oldPrice,
	stock,
	tags,
	onDelete,
	onAddToCart,
	onTagPress,
	className = '',
	imageClassName = '',
	contentClassName = '',
	nameClassName = '',
	priceClassName = '',
	stockClassName = '',
	tagsClassName = '',
}: WishlistItemProps) {
	return (
		<StyledWishlistItemRoot className={className}>
			<StyledWishlistItemImageContainer className={imageClassName}>
				<GluestackWishlistItemImage source={imageSource} className='w-full h-full' />
				<GluestackWishlistItemDeleteButton onPress={onDelete}>
					<Ionicons name='trash' size={14} color='#FFFFFF' />
				</GluestackWishlistItemDeleteButton>
			</StyledWishlistItemImageContainer>
			<StyledWishlistItemContent className={contentClassName}>
				<StyledWishlistItemName className={nameClassName}>{name}</StyledWishlistItemName>
				<StyledWishlistItemPriceContainer className={priceClassName}>
					{oldPrice && (
						<StyledWishlistItemOldPrice>{oldPrice}</StyledWishlistItemOldPrice>
					)}
					<StyledWishlistItemPrice>{price}</StyledWishlistItemPrice>
				</StyledWishlistItemPriceContainer>
				<StyledWishlistItemTagsContainer className={tagsClassName}>
					{tags.map((tag, index) => (
						<GluestackWishlistItemTag key={index} onPress={() => onTagPress?.(tag)}>
							<StyledWishlistItemTagText>{tag}</StyledWishlistItemTagText>
						</GluestackWishlistItemTag>
					))}
				</StyledWishlistItemTagsContainer>
				<View className='absolute bottom-0 right-0 z-10 items-end'>
					<StyledWishlistItemStock className={`mb-1 ${stockClassName}`}>
						{stock}
					</StyledWishlistItemStock>
					<GluestackWishlistItemAddToCartButton onPress={onAddToCart}>
						<Ionicons name='bag-add' size={18} color='#FFFFFF' />
					</GluestackWishlistItemAddToCartButton>
				</View>
			</StyledWishlistItemContent>
		</StyledWishlistItemRoot>
	);
}
